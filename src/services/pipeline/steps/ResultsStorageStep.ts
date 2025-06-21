/**
 * Results Storage Pipeline Step
 *
 * Saves job analysis results to the database and handles duplicates
 */

import {EnhancedLogger} from '@/utils/enhancedLogger';
import {SavedJob, ApplicationStatus} from '@/models/SavedJob';
import {UserService} from '../../userService';
import type {PipelineStep, PipelineContext} from '../types';
import type {JobAnalysisResult} from '@/utils/aiProcessor';

const logger = EnhancedLogger.getLogger('ResultsStorageStep', {
	logToFile: true,
	logToConsole: true,
	logDir: '/tmp/scoutly-logs',
	logFileName: 'job-results-storage.log',
});

export class ResultsStorageStep implements PipelineStep {
	readonly name = 'ResultsStorage';
	readonly description = 'Saves job analysis results to database';

	/**
	 * Save analysis results to database
	 */
	async execute(context: PipelineContext): Promise<PipelineContext> {
		// Story logging for narrative
		context.storyLogger.addToStory(
			'info',
			'ResultsStorage',
			'💾 Saving your personalized job analysis results to the database for future access...',
		);

		// Debug logging
		logger.info('💾 Saving job analysis results to database...');

		try {
			if (!context.analysisResults || context.analysisResults.size === 0) {
				logger.warn('No analysis results to save');
				context.storyLogger.addToStory(
					'warn',
					'ResultsStorage',
					'No analysis results found to save - this pipeline run found no suitable job matches',
				);
				// Initialize saved results tracking
				context.savedJobsCount = 0;
				context.savedJobsMap = new Map();
				return context;
			}

			// Get user for database operations
			const user = await UserService.getUserByEmail(context.userEmail);
			if (!user) {
				throw new Error(`User not found: ${context.userEmail}`);
			}

			let totalSaved = 0;
			let totalSkipped = 0;
			let totalFailed = 0;
			const savedJobsMap = new Map<string, JobAnalysisResult[]>();

			// Count total jobs to be processed
			const totalResults = Array.from(context.analysisResults.values()).reduce(
				(sum, results) => sum + results.length,
				0,
			);

			// Story logging for process start
			context.storyLogger.addToStory(
				'info',
				'ResultsStorage',
				`Processing ${totalResults} analyzed job positions for database storage...`,
				{totalResults},
			);

			// Process results for each company
			for (const [companyId, results] of context.analysisResults.entries()) {
				if (results.length === 0) continue;

				try {
					// Set company context for logging
					const company = context.companies.find(c => c.id === companyId);
					const companyName = company?.company || `Company ${companyId}`;

					logger.info(
						`Saving ${results.length} job results for ${companyName}...`,
					);
					const {saved, skipped, failed, savedJobs} =
						await this.saveCompanyResults(
							results,
							user.id,
							company?._id?.toString() || companyId, // Convert ObjectId to string
							companyName,
						);

					totalSaved += saved;
					totalSkipped += skipped;
					totalFailed += failed;

					// Track actually saved jobs for accurate count reporting
					if (savedJobs.length > 0) {
						savedJobsMap.set(companyId, savedJobs);
					}

					logger.info(
						`✓ ${companyName}: ${saved} saved, ${skipped} duplicates, ${failed} failed`,
					);
				} catch (error) {
					logger.error(
						`Failed to save results for company ${companyId}:`,
						error,
					);
					totalFailed += results.length;
				}
			}

			// Store summary in context for API response
			context.savedJobsCount = totalSaved;
			context.savedJobsMap = savedJobsMap;

			// Story logging for final results
			if (totalSaved > 0) {
				const companyNames = Array.from(savedJobsMap.keys()).map(
					companyId =>
						context.companies.find(c => c.id === companyId)?.company ||
						companyId,
				);
				context.storyLogger.addToStory(
					'success',
					'ResultsStorage',
					`🎉 Successfully saved ${totalSaved} new job opportunities to your database! ${
						totalSkipped > 0
							? `${totalSkipped} duplicates were skipped (already in your saved jobs). `
							: ''
					}${
						totalFailed > 0 ? `${totalFailed} jobs failed to save. ` : ''
					}New jobs saved from: ${companyNames.join(
						', ',
					)}. You can now view these personalized job matches in your dashboard!`,
					{
						totalSaved,
						totalSkipped,
						totalFailed,
						companiesWithSavedJobs: companyNames.length,
						companies: companyNames,
					},
				);
			} else {
				context.storyLogger.addToStory(
					'warn',
					'ResultsStorage',
					`No new jobs were saved to the database. ${
						totalSkipped > 0
							? `${totalSkipped} jobs were duplicates of positions already in your saved jobs. `
							: ''
					}${
						totalFailed > 0
							? `${totalFailed} jobs failed to save due to errors.`
							: ''
					}`,
					{totalSaved, totalSkipped, totalFailed},
				);
			}

			logger.info(
				`✅ Database storage completed: ${totalSaved} saved, ${totalSkipped} duplicates, ${totalFailed} failed`,
			);

			return context;
		} catch (error) {
			logger.error('Failed to save results to database:', error);
			throw new Error(
				`Results storage failed: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`,
			);
		}
	}

	/**
	 * Skip if there are no analysis results to save
	 */
	canSkip(context: PipelineContext): boolean {
		return !context.analysisResults || context.analysisResults.size === 0;
	}

	/**
	 * Validate context before saving results
	 */
	validate(context: PipelineContext): void {
		if (!context.userEmail || typeof context.userEmail !== 'string') {
			throw new Error('User email is required for saving results');
		}

		if (!context.analysisResults || context.analysisResults.size === 0) {
			logger.info('No analysis results to validate - step will be skipped');
			return;
		}

		if (!context.companies || context.companies.length === 0) {
			throw new Error('Companies data is required for saving results');
		}
	}

	/**
	 * Save results for a single company
	 */
	private async saveCompanyResults(
		results: JobAnalysisResult[],
		userId: string,
		companyObjectId: string,
		companyName: string,
	): Promise<{
		saved: number;
		skipped: number;
		failed: number;
		savedJobs: JobAnalysisResult[];
	}> {
		let saved = 0;
		let skipped = 0;
		let failed = 0;
		const savedJobs: JobAnalysisResult[] = [];

		for (const job of results) {
			try {
				// Check if job already exists (by URL + title for better duplicate detection)
				const existingJob = await SavedJob.findOne({
					userId: userId,
					$or: [
						{jobId: job.url}, // Same URL
					],
				});

				if (existingJob) {
					logger.debug(`Skipping duplicate job: "${job.title}" (${job.url})`);
					skipped++;
					continue;
				}

				// Create new saved job with full Gemini schema data
				await SavedJob.create({
					userId: userId,
					jobId: job.url, // Use URL as unique job identifier
					companyId: companyObjectId,
					status: ApplicationStatus.WANT_TO_APPLY,

					// Core job information (required by Gemini schema)
					title: job.title,
					url: job.url,
					goodFitReasons: job.goodFitReasons || [],
					considerationPoints: job.considerationPoints || [],
					stretchGoals: job.stretchGoals || [],
					suitabilityScore: job.suitabilityScore || 0,

					// Optional job details (if present in Gemini response)
					location: job.location,
					timezone: job.timezone,
					salary: job.salary,
					techStack: job.techStack,
					experienceLevel: job.experienceLevel,
					languageRequirements: job.languageRequirements,
					visaSponsorshipOffered: job.visaSponsorshipOffered,
					relocationAssistanceOffered: job.relocationAssistanceOffered,

					notes: `AI Analysis Summary: ${
						job.suitabilityScore
					}% match - ${job.goodFitReasons.join(', ')}`,
				});

				saved++;
				savedJobs.push(job);
				logger.debug(`Saved job: "${job.title}" (${job.url})`);
			} catch (dbError) {
				logger.error(`Failed to save job "${job.title}":`, {
					error: dbError,
					url: job.url,
					companyName,
				});
				failed++;
			}
		}

		return {saved, skipped, failed, savedJobs};
	}

	/**
	 * Handle results storage errors
	 */
	async onError(error: Error, context: PipelineContext): Promise<void> {
		logger.error('Results storage step failed:', {
			error: error.message,
			userEmail: context.userEmail,
			analysisResultsCount: context.analysisResults
				? Array.from(context.analysisResults.values()).reduce(
						(sum, results) => sum + results.length,
						0,
				  )
				: 0,
			companiesCount: context.companies.length,
		});

		// Could implement fallback logic here, such as:
		// - Save to temporary storage
		// - Queue for retry later
		// - Export to file for manual import

		// For now, we'll let the error propagate since saving results is critical
		// The pipeline can be configured to continue on error if needed
	}
}
