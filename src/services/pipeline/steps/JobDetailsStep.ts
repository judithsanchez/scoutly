/**
 * Job Details Pipeline Step
 *
 * Scrapes detailed content for matched job positions
 */

import {Logger} from '@/utils/logger';
import {scrapeJobDetails} from '@/utils/jobScraper';
import type {PipelineStep, PipelineContext} from '../types';

const logger = new Logger('JobDetailsStep');

export class JobDetailsStep implements PipelineStep {
	readonly name = 'JobDetails';
	readonly description = 'Scrapes detailed content for matched job positions';

	/**
	 * Scrape detailed job content for matched positions
	 */
	async execute(context: PipelineContext): Promise<PipelineContext> {
		// Story logging for narrative
		context.storyLogger.addToStory(
			'info',
			'JobDetails',
			'🌐 Now fetching detailed job descriptions for the matched positions...',
		);

		// Debug logging
		logger.info('🌐 Fetching detailed job content...');

		try {
			if (!context.matchedJobs || context.matchedJobs.length === 0) {
				logger.warn('No matched jobs to fetch details for');
				context.storyLogger.addToStory(
					'warn',
					'JobDetails',
					'No matched jobs found to fetch details for - skipping this step',
				);
				context.jobDetails = new Map();
				return context;
			}

			const urls = context.matchedJobs.map(job => job.url);

			// Story logging for process start
			context.storyLogger.addToStory(
				'info',
				'JobDetails',
				`Fetching detailed job descriptions for ${
					urls.length
				} matched positions: ${context.matchedJobs
					.map(job => job.title)
					.join(', ')}`,
				{jobCount: urls.length},
			);

			logger.info(`Fetching content for ${urls.length} matched positions...`);

			// Use the job scraper utility to get detailed content
			context.jobDetails = await scrapeJobDetails(urls, {
				timeout: 120000,
				waitUntil: 'networkidle',
				maxRetries: 5,
				baseDelay: 1000,
				maxBackoff: 30000,
			});

			const successfullyScraped = context.jobDetails.size;
			const failed = urls.length - successfullyScraped;

			if (successfullyScraped === 0) {
				logger.warn('Failed to fetch content for any matched positions');
				context.storyLogger.addToStory(
					'error',
					'JobDetails',
					'❌ Failed to fetch detailed content for any of the matched job positions',
				);
			} else {
				// Story logging for results
				context.storyLogger.addToStory(
					'success',
					'JobDetails',
					`✅ Job details fetched successfully! Retrieved detailed descriptions for ${successfullyScraped} positions. ${
						failed > 0
							? `${failed} positions failed to load.`
							: 'All jobs loaded successfully.'
					}`,
					{successfullyScraped, failed, totalJobs: urls.length},
				);

				logger.info(
					`✓ Job details fetched successfully: ${successfullyScraped} scraped, ${failed} failed`,
				);
			}

			return context;
		} catch (error) {
			logger.error('Failed to fetch job details:', error);
			throw new Error(
				`Job details fetching failed: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`,
			);
		}
	}

	/**
	 * Skip if job details are already available
	 */
	canSkip(context: PipelineContext): boolean {
		return !!(context.jobDetails && context.jobDetails.size > 0);
	}

	/**
	 * Validate context before fetching job details
	 */
	validate(context: PipelineContext): void {
		if (!context.matchedJobs || !Array.isArray(context.matchedJobs)) {
			throw new Error('Matched jobs are required for fetching job details');
		}

		// Validate that matched jobs have URLs
		for (let i = 0; i < context.matchedJobs.length; i++) {
			const job = context.matchedJobs[i];
			if (!job.url || typeof job.url !== 'string') {
				throw new Error(`Invalid job URL at index ${i}`);
			}
		}
	}

	/**
	 * Handle job details fetching errors
	 */
	async onError(error: Error, context: PipelineContext): Promise<void> {
		logger.error('Job details step failed:', {
			error: error.message,
			userEmail: context.userEmail,
			matchedJobsCount: context.matchedJobs?.length || 0,
			urls: context.matchedJobs?.map(job => job.url) || [],
		});

		// Could implement fallback logic here, such as:
		// - Retry with reduced timeout
		// - Use cached job content if available
		// - Continue with partial results

		// For now, initialize empty job details to allow pipeline to continue
		context.jobDetails = new Map();
	}
}
