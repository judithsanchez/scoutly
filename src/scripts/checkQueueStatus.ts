#!/usr/bin/env tsx

/**
 * Check job queue status
 */

import {connectDB, disconnectDB} from '../config/database';
import {JobQueue, JobStatus} from '../models/JobQueue';
import {EnhancedLogger} from '../utils/enhancedLogger';

const logger = EnhancedLogger.getLogger('QueueStatus', {
	logToFile: true,
	logToConsole: true,
	logDir: '/tmp/scoutly-logs',
	logFileName: 'QueueStatus.log'.toLowerCase(),
});

async function checkQueueStatus() {
	try {
		await connectDB();
		console.log('Connected to database');

		// Count jobs by status
		const pendingCount = await JobQueue.countDocuments({
			status: JobStatus.PENDING,
		});
		const processingCount = await JobQueue.countDocuments({
			status: JobStatus.PROCESSING,
		});
		const completedCount = await JobQueue.countDocuments({
			status: JobStatus.COMPLETED,
		});
		const failedCount = await JobQueue.countDocuments({
			status: JobStatus.FAILED,
		});

		console.log('=== Job Queue Status ===');
		console.log(`- Pending: ${pendingCount}`);
		console.log(`- Processing: ${processingCount}`);
		console.log(`- Completed: ${completedCount}`);
		console.log(`- Failed: ${failedCount}`);

		// List some recent jobs
		console.log('\n=== Recent Jobs ===');
		const recentJobs = await JobQueue.find().sort({updatedAt: -1}).limit(5);
		recentJobs.forEach(job => {
			console.log(
				`- ID: ${job._id}, Status: ${job.status}, Last Updated: ${job.updatedAt}`,
			);
		});

		await disconnectDB();
	} catch (error: any) {
		logger.error(`Error checking queue status: ${error.message}`);
		await disconnectDB();
	}
}

if (require.main === module) {
	checkQueueStatus()
		.then(() => {
			process.exit(0);
		})
		.catch(error => {
			console.error(error);
			process.exit(1);
		});
}
