/**
 * Initial Matching Pipeline Step
 *
 * Performs AI-powered initial job filtering to identify potentially suitable positions
 */

import {Logger} from '@/utils/logger';
import {performInitialMatching} from '@/utils/aiProcessor';
import {checkDailyReset, checkRateLimits} from '@/utils/rateLimiting';
import type {PipelineStep, PipelineContext} from '../types';
import type {ExtractedLink} from '@/utils/scraper';

const logger = new Logger('InitialMatchingStep');

export class InitialMatchingStep implements PipelineStep {
	readonly name = 'InitialMatching';
	readonly description = 'Performs AI-powered initial job filtering';

	/**
	 * Execute initial job matching using AI
	 */
	async execute(context: PipelineContext): Promise<PipelineContext> {
		// Story logging for narrative
		context.storyLogger.addToStory(
			'info',
			'InitialMatching',
			'🔍 Starting AI-powered initial job filtering to identify potentially suitable positions...',
		);

		// Debug logging
		logger.info('🔍 Starting initial job matching analysis...');

		try {
			// Check rate limits before proceeding
			context.usageStats = checkDailyReset(context.usageStats);
			await checkRateLimits(context.modelLimits, context.usageStats);

			// Collect all new job links from scraped data
			const allNewLinks: ExtractedLink[] = [];
			if (context.scrapedData) {
				for (const [companyId, links] of context.scrapedData.entries()) {
					allNewLinks.push(...links);
				}
			}

			if (allNewLinks.length === 0) {
				logger.warn('No job links available for initial matching');
				context.storyLogger.addToStory(
					'warn',
					'InitialMatching',
					'No new job links found to analyze - skipping initial matching',
				);
				context.matchedJobs = [];
				return context;
			}

			// Story logging for process start
			context.storyLogger.addToStory(
				'info',
				'InitialMatching',
				`Running AI analysis on ${allNewLinks.length} job postings to find matches based on your CV and profile...`,
				{jobLinksCount: allNewLinks.length},
			);

			logger.info(
				`Running initial matching analysis for ${allNewLinks.length} jobs...`,
			);

			// Validate required context data
			if (!context.cvContent) {
				throw new Error('CV content is required for initial matching');
			}
			if (!context.candidateProfile) {
				throw new Error('Candidate profile is required for initial matching');
			}

			// Update AI config with current usage stats
			context.aiConfig.usageStats = context.usageStats;

			// Perform initial matching using AI utility
			context.matchedJobs = await performInitialMatching(
				allNewLinks,
				context.cvContent,
				context.candidateProfile,
				context.aiConfig,
			);

			// Story logging for results
			context.storyLogger.addToStory(
				'success',
				'InitialMatching',
				`✅ AI analysis completed! Found ${
					context.matchedJobs.length
				} potentially suitable job matches out of ${
					allNewLinks.length
				} total jobs analyzed. The AI filtered out ${
					allNewLinks.length - context.matchedJobs.length
				} jobs that weren't a good fit.`,
				{
					matchedJobs: context.matchedJobs.length,
					totalJobs: allNewLinks.length,
					filteredOut: allNewLinks.length - context.matchedJobs.length,
				},
			);

			logger.info(
				`✓ Initial matching completed. Found ${context.matchedJobs.length} potentially suitable jobs.`,
			);

			return context;
		} catch (error) {
			logger.error('Failed to perform initial matching:', error);
			throw new Error(
				`Initial matching failed: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`,
			);
		}
	}

	/**
	 * Skip if matched jobs are already available
	 */
	canSkip(context: PipelineContext): boolean {
		return !!(context.matchedJobs && context.matchedJobs.length > 0);
	}

	/**
	 * Validate context before initial matching
	 */
	validate(context: PipelineContext): void {
		if (!context.cvContent || context.cvContent.length === 0) {
			throw new Error('CV content is required for initial matching');
		}

		if (
			!context.candidateProfile ||
			Object.keys(context.candidateProfile).length === 0
		) {
			throw new Error('Candidate profile is required for initial matching');
		}

		if (!context.scrapedData || context.scrapedData.size === 0) {
			throw new Error('Scraped job data is required for initial matching');
		}

		if (!context.aiConfig || !context.aiConfig.model) {
			throw new Error('AI configuration is required for initial matching');
		}

		if (
			!context.aiConfig.templates ||
			!context.aiConfig.templates.firstSelectionTask
		) {
			throw new Error('AI templates are required for initial matching');
		}
	}

	/**
	 * Handle initial matching errors
	 */
	async onError(error: Error, context: PipelineContext): Promise<void> {
		logger.error('Initial matching step failed:', {
			error: error.message,
			userEmail: context.userEmail,
			availableJobsCount: context.scrapedData
				? Array.from(context.scrapedData.values()).reduce(
						(sum, links) => sum + links.length,
						0,
				  )
				: 0,
			cvContentLength: context.cvContent?.length || 0,
			hasProfile: !!context.candidateProfile,
		});

		// Could implement fallback logic here, such as:
		// - Use simpler keyword-based matching
		// - Retry with reduced job count
		// - Continue with all jobs (skip filtering)

		// For now, set empty matched jobs to allow pipeline to continue
		context.matchedJobs = [];
	}
}
