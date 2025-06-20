/**
 * Deep Analysis Pipeline Step
 *
 * Performs detailed AI analysis and scoring of job matches
 */

import {Logger} from '@/utils/logger';
import {analyzeJobBatch, type JobAnalysisResult} from '@/utils/aiProcessor';
import {createBatches, processSequentialBatches} from '@/utils/batchProcessing';
import {checkDailyReset, checkRateLimits} from '@/utils/rateLimiting';
import type {PipelineStep, PipelineContext} from '../types';

const logger = new Logger('DeepAnalysisStep');
const BATCH_SIZE = 5; // Process jobs in batches to manage API limits

export class DeepAnalysisStep implements PipelineStep {
	readonly name = 'DeepAnalysis';
	readonly description =
		'Performs detailed AI analysis and scoring of job matches';

	/**
	 * Execute deep analysis of matched jobs
	 */
	async execute(context: PipelineContext): Promise<PipelineContext> {
		logger.info('🔬 Starting deep dive analysis...');

		try {
			// Check rate limits before proceeding
			context.usageStats = checkDailyReset(context.usageStats);
			await checkRateLimits(context.modelLimits, context.usageStats);

			if (!context.matchedJobs || context.matchedJobs.length === 0) {
				logger.warn('No matched jobs available for deep analysis');
				context.analysisResults = new Map();
				return context;
			}

			// Prepare jobs with content for analysis
			const jobsWithContent = this.prepareJobsForAnalysis(context);

			if (jobsWithContent.length === 0) {
				logger.warn('No jobs with content available for analysis');
				context.analysisResults = new Map();
				return context;
			}

			logger.info(
				`Processing ${jobsWithContent.length} jobs for deep analysis...`,
			);

			// Validate required context data
			if (!context.cvContent) {
				throw new Error('CV content is required for deep analysis');
			}
			if (!context.candidateProfile) {
				throw new Error('Candidate profile is required for deep analysis');
			}

			// Update AI config with current usage stats
			context.aiConfig.usageStats = context.usageStats;

			// Process jobs in batches with token usage tracking
			const batches = createBatches(jobsWithContent, BATCH_SIZE);
			const allResults: JobAnalysisResult[] = [];
			
			// Process each batch sequentially and record token usage
			for (let i = 0; i < batches.length; i++) {
				const batch = batches[i];
				logger.info(`Processing batch ${i + 1}/${batches.length} with ${batch.length} jobs...`);
				
				const batchResult = await analyzeJobBatch(
					batch,
					context.cvContent!,
					context.candidateProfile!,
					context.aiConfig,
				);
				
				// Collect results
				allResults.push(...batchResult.results);
				
				// Record token usage for this batch
				await context.recordUsage(batchResult.tokenUsage);
			}

			// Sort results by suitability score
			const sortedResults = allResults.sort(
				(a, b) => b.suitabilityScore - a.suitabilityScore,
			);

			// Group results by company
			context.analysisResults = this.groupResultsByCompany(
				sortedResults,
				context,
			);

			const totalResults = sortedResults.length;

			// Log detailed analysis summary
			logger.info('✓ Deep analysis completed with detailed breakdown:', {
				totalAnalyzed: allResults.length,
				totalAccepted: totalResults,
				totalRejected: allResults.length - totalResults,
				scoreDistribution: {
					excellent: allResults.filter((r: any) => r.suitabilityScore >= 80)
						.length,
					good: allResults.filter(
						(r: any) => r.suitabilityScore >= 60 && r.suitabilityScore < 80,
					).length,
					fair: allResults.filter(
						(r: any) => r.suitabilityScore >= 30 && r.suitabilityScore < 60,
					).length,
					poor: allResults.filter(
						(r: any) => r.suitabilityScore > 0 && r.suitabilityScore < 30,
					).length,
					rejected: allResults.filter((r: any) => r.suitabilityScore === 0)
						.length,
				},
				topScores: sortedResults.slice(0, 3).map((r: any) => ({
					title: r.title,
					score: r.suitabilityScore,
					topReason: r.goodFitReasons?.[0] || 'No reasons provided',
				})),
			});

			logger.info(
				`✓ Deep analysis completed. Generated ${totalResults} detailed job analyses.`,
			);

			return context;
		} catch (error) {
			logger.error('Failed to perform deep analysis:', error);
			throw new Error(
				`Deep analysis failed: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`,
			);
		}
	}

	/**
	 * Skip if analysis results are already available
	 */
	canSkip(context: PipelineContext): boolean {
		return !!(context.analysisResults && context.analysisResults.size > 0);
	}

	/**
	 * Validate context before deep analysis
	 */
	validate(context: PipelineContext): void {
		if (!context.cvContent || context.cvContent.length === 0) {
			throw new Error('CV content is required for deep analysis');
		}

		if (
			!context.candidateProfile ||
			Object.keys(context.candidateProfile).length === 0
		) {
			throw new Error('Candidate profile is required for deep analysis');
		}

		if (!context.matchedJobs || context.matchedJobs.length === 0) {
			throw new Error('Matched jobs are required for deep analysis');
		}

		if (!context.jobDetails) {
			throw new Error('Job details are required for deep analysis');
		}

		if (!context.aiConfig || !context.aiConfig.model) {
			throw new Error('AI configuration is required for deep analysis');
		}

		if (
			!context.aiConfig.templates ||
			!context.aiConfig.templates.jobPostDeepDive
		) {
			throw new Error('AI templates are required for deep analysis');
		}
	}

	/**
	 * Prepare jobs with content for analysis
	 */
	private prepareJobsForAnalysis(context: PipelineContext): Array<{
		title: string;
		url: string;
		content: string;
	}> {
		if (!context.matchedJobs || !context.jobDetails) {
			return [];
		}

		return context.matchedJobs
			.map(job => {
				const content = context.jobDetails!.get(job.url);
				return content ? {...job, content} : null;
			})
			.filter((job): job is NonNullable<typeof job> => job !== null);
	}

	/**
	 * Group analysis results by company
	 */
	private groupResultsByCompany(
		results: JobAnalysisResult[],
		context: PipelineContext,
	): Map<string, JobAnalysisResult[]> {
		const resultsByCompany = new Map<string, JobAnalysisResult[]>();

		if (!context.scrapedData) {
			return resultsByCompany;
		}

		// Create URL to company mapping
		const urlToCompany = new Map<string, string>();
		for (const [companyId, links] of context.scrapedData.entries()) {
			for (const link of links) {
				urlToCompany.set(link.url, companyId);
			}
		}

		// Group results by company
		for (const result of results) {
			const companyId = urlToCompany.get(result.url);
			if (companyId) {
				const companyResults = resultsByCompany.get(companyId) || [];
				companyResults.push(result);
				resultsByCompany.set(companyId, companyResults);
			}
		}

		return resultsByCompany;
	}

	/**
	 * Handle deep analysis errors
	 */
	async onError(error: Error, context: PipelineContext): Promise<void> {
		logger.error('Deep analysis step failed:', {
			error: error.message,
			userEmail: context.userEmail,
			matchedJobsCount: context.matchedJobs?.length || 0,
			jobDetailsCount: context.jobDetails?.size || 0,
			cvContentLength: context.cvContent?.length || 0,
			hasProfile: !!context.candidateProfile,
		});

		// Could implement fallback logic here, such as:
		// - Use simpler scoring mechanism
		// - Retry with fewer jobs
		// - Apply default scores based on job titles

		// For now, initialize empty results to allow pipeline to continue
		context.analysisResults = new Map();
	}
}
