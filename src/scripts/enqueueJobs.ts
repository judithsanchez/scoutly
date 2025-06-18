#!/usr/bin/env tsx

/**
 * Job Enqueuer Script - Anacron Compatible
 *
 * This script identifies companies that need scraping based on user preferences
 * and their rank-based scheduling. Designed to work with anacron for systems
 * that aren't always on.
 *
 * Usage: npx tsx src/scripts/enqueueJobs.ts
 */

import {connectDB, disconnectDB} from '../config/database';
import {Company} from '../models/Company';
import {UserCompanyPreference} from '../models/UserCompanyPreference';
import {JobQueue, JobStatus} from '../models/JobQueue';
import {
	calculateAnacronPriority,
	isCompanyDueForScraping,
} from '../utils/scrapeScheduling';
import {SimpleLogger} from '../utils/simpleLogger';

const logger = new SimpleLogger('JobEnqueuer');

async function enqueueJobs() {
	try {
		logger.info('🚀 Starting job enqueuer process...');
		await connectDB();

		// Get all active user company preferences
		const userPreferences = await UserCompanyPreference.find({
			isTracking: true,
		}).populate('companyId');

		logger.info(
			`📊 Found ${userPreferences.length} active company tracking preferences`,
		);

		if (userPreferences.length === 0) {
			logger.info('ℹ️ No companies are being tracked. Exiting.');
			return;
		}

		// Calculate priorities and filter companies that need scraping
		const companiesWithPriority = [];

		for (const pref of userPreferences) {
			const company = pref.companyId as any;

			if (!company) {
				logger.warn(`⚠️ Company not found for preference ${pref._id}`);
				continue;
			}

			// Check if company is due for scraping
			if (isCompanyDueForScraping(pref.rank, company.lastSuccessfulScrape)) {
				const priority = calculateAnacronPriority(
					pref.rank,
					company.lastSuccessfulScrape,
				);

				companiesWithPriority.push({
					company,
					preference: pref,
					priority,
				});
			}
		}

		logger.info(
			`📋 Found ${companiesWithPriority.length} companies due for scraping`,
		);

		if (companiesWithPriority.length === 0) {
			logger.info('✅ No companies need scraping at this time');
			return;
		}

		// Sort by priority (highest first) for anacron processing
		companiesWithPriority.sort((a, b) => b.priority - a.priority);

		// Enqueue jobs, checking for existing pending/processing jobs
		let enqueuedCount = 0;
		const maxJobs = 50; // Limit to prevent overwhelming the system

		for (const {company, preference, priority} of companiesWithPriority.slice(
			0,
			maxJobs,
		)) {
			// Check if company already has a pending or processing job
			const existingJob = await JobQueue.findOne({
				companyId: company._id,
				status: {$in: [JobStatus.PENDING, JobStatus.PROCESSING]},
			});

			if (existingJob) {
				logger.debug(
					`⏭️ Skipping ${company.company} - job already exists (${existingJob.status})`,
				);
				continue;
			}

			// Create new job
			await JobQueue.create({
				companyId: company._id,
				status: JobStatus.PENDING,
			});

			enqueuedCount++;
			logger.debug(
				`➕ Enqueued job for ${company.company} (rank: ${
					preference.rank
				}, priority: ${priority.toFixed(2)})`,
			);
		}

		logger.success(
			`✅ Enqueuer process completed. Enqueued ${enqueuedCount} jobs.`,
		);
	} catch (error: any) {
		logger.error(
			'❌ Error in enqueuer process:',
			error.message || 'Unknown error',
		);
		if (error.stack) {
			logger.error('Stack trace:', error.stack);
		}
		throw error;
	} finally {
		await disconnectDB();
	}
}

// Main execution
if (require.main === module) {
	enqueueJobs()
		.then(() => {
			logger.info('🏁 Enqueuer script completed successfully');
			process.exit(0);
		})
		.catch(error => {
			logger.error('💥 Enqueuer script failed:', error);
			process.exit(1);
		});
}

export {enqueueJobs};
