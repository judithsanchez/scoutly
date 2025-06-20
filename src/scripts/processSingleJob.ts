#!/usr/bin/env tsx

/**
 * Simple test script to process a single job from the queue
 * This script is useful for debugging and testing the job processing pipeline
 */

import {connectDB, disconnectDB} from '../config/database';
import {JobQueue, JobStatus} from '../models/JobQueue';
import {Company} from '../models/Company';
import {EnhancedLogger} from '../utils/enhancedLogger';

// Create a logger for this script
const logger = EnhancedLogger.getLogger('SingleJobProcessor', {
	logToFile: true,
	logToConsole: true,
	logDir: '/tmp/scoutly-logs',
	logFileName: 'SingleJobProcessor.log'.toLowerCase(),
});

// Main function to process a single job
async function processSingleJob() {
	logger.info('🚀 Starting single job processor...');

	try {
		// Connect to the database
		await connectDB();
		logger.info('✅ Connected to database');

		// Find one pending job
		const job = await JobQueue.findOne({status: JobStatus.PENDING}).sort({
			createdAt: 1,
		});

		if (!job) {
			logger.warn('⚠️ No pending jobs found in the queue');
			await disconnectDB();
			return;
		}

		logger.info(`📝 Found job: ${job._id}`);

		// Mark job as processing
		job.status = JobStatus.PROCESSING;
		job.lastAttemptAt = new Date();
		await job.save();
		logger.info(`✅ Marked job as processing`);

		// Get company information
		const company = await Company.findById(job.companyId);

		if (!company) {
			logger.error(`❌ Company not found for job: ${job._id}`);
			job.status = JobStatus.FAILED;
			job.retryCount = (job.retryCount || 0) + 1;
			await job.save();
			await disconnectDB();
			return;
		}

		logger.info(`📝 Processing job for company: ${company.company}`);

		// Check for required environment variables
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			logger.error('❌ GEMINI_API_KEY environment variable is not set');
			job.status = JobStatus.FAILED;
			job.retryCount = (job.retryCount || 0) + 1;
			await job.save();
			await disconnectDB();
			return;
		}

		logger.info(`✅ GEMINI_API_KEY is set`);
		logger.info(`✅ Company: ${company.company}, URL: ${company.careers_url}`);

		// Simulate successful processing (for testing)
		job.status = JobStatus.COMPLETED;
		await job.save();
		logger.success(`✅ Successfully processed job for ${company.company}`);

		// Clean up
		await disconnectDB();
	} catch (error: any) {
		logger.error(`💥 Error processing job: ${error.message}`);
		try {
			await disconnectDB();
		} catch (disconnectError) {
			logger.error('Failed to disconnect from database:', disconnectError);
		}
	}
}

// Execute the function
if (require.main === module) {
	processSingleJob()
		.then(() => {
			logger.info('🏁 Script completed');
			process.exit(0);
		})
		.catch(error => {
			logger.error('💥 Script failed:', error);
			process.exit(1);
		});
}
