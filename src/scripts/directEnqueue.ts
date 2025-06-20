#!/usr/bin/env tsx

/**
 * Direct Enqueue Script - Without complex population
 */

import mongoose from 'mongoose';
import {Company} from '../models/Company';
import {UserCompanyPreference} from '../models/UserCompanyPreference';
import {JobQueue, JobStatus} from '../models/JobQueue';
import {
	calculateAnacronPriority,
	isCompanyDueForScraping,
} from '../utils/scrapeScheduling';
import { EnhancedLogger } from '../utils/enhancedLogger';

const logger = EnhancedLogger.getLogger('DirectEnqueuer', {
  logToFile: true,
  logToConsole: true,
  logDir: '/tmp/scoutly-logs',
  logFileName: 'DirectEnqueuer.log'.toLowerCase()
});

const MONGODB_URI =
	process.env.MONGODB_URI || 'mongodb://mongodb:27017/scoutly';

async function directEnqueue() {
	try {
		logger.info('🚀 Starting direct enqueuer process...');

		await mongoose.connect(MONGODB_URI, {
			serverSelectionTimeoutMS: 5000,
			connectTimeoutMS: 5000,
		});

		logger.info('✅ Connected to database');

		// Get all active user preferences
		const preferences = await UserCompanyPreference.find({
			isTracking: true,
		});

		logger.info(`📊 Found ${preferences.length} active preferences`);

		if (preferences.length === 0) {
			logger.info('ℹ️ No companies are being tracked');
			return;
		}

		// Process each preference and fetch the company separately
		const companiesWithPriority = [];

		for (const pref of preferences) {
			// Get company details
			const company = await Company.findById(pref.companyId);

			if (!company) {
				logger.warn(`⚠️ Company not found for preference ${pref._id}`);
				continue;
			}

			// Check if due for scraping
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

		// Sort by priority (highest first)
		companiesWithPriority.sort((a, b) => b.priority - a.priority);

		// Enqueue jobs
		let enqueuedCount = 0;
		const maxJobs = 20; // Limit batch size

		for (const {company, preference, priority} of companiesWithPriority.slice(
			0,
			maxJobs,
		)) {
			// Check for existing job
			const existingJob = await JobQueue.findOne({
				companyId: company._id,
				status: {$in: [JobStatus.PENDING, JobStatus.PROCESSING]},
			});

			if (existingJob) {
				logger.info(
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
			logger.info(
				`➕ Enqueued job for ${company.company} (rank: ${
					preference.rank
				}, priority: ${priority.toFixed(2)})`,
			);
		}

		logger.info(`✅ Enqueued ${enqueuedCount} jobs`);
	} catch (error: any) {
		logger.error(
			'❌ Error in direct enqueuer:',
			error.message || 'Unknown error',
		);
		if (error.stack) {
			logger.error('Stack trace:', error.stack);
		}
	} finally {
		await mongoose.disconnect();
		logger.info('🔒 Disconnected from database');
	}
}

// Execute
directEnqueue()
	.then(() => {
		logger.info('🏁 Direct enqueuer completed');
		process.exit(0);
	})
	.catch(error => {
		logger.error(
			'💥 Direct enqueuer failed:',
			error.message || 'Unknown error',
		);
		process.exit(1);
	});
