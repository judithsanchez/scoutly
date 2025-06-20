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
		logger.info('💾 Saving job analysis results to database...');

		try {
			if (!context.analysisResults || context.analysisResults.size === 0) {
				logger.warn('No analysis results to save');
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
							companyId,
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
		companyId: string,
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
					user: userId,
					$or: [
						{url: job.url}, // Same URL
						{url: job.url, title: job.title}, // Same URL and title
					],
				});

				if (existingJob) {
					logger.debug(`Skipping duplicate job: "${job.title}" (${job.url})`);
					skipped++;
					continue;
				}

				// Create new saved job
				await SavedJob.create({
					...job,
					user: userId,
					company: companyId,
					status: ApplicationStatus.WANT_TO_APPLY,
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
