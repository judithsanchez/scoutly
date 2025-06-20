#!/usr/bin/env tsx

/**
 * Check job queue status
 */

import {connectDB, disconnectDB} from '../config/database';
import {JobQueue, JobStatus} from '../models/JobQueue';
import fs from 'fs';

async function checkQueueStatus() {
	const outputPath = '/tmp/queue_status.txt';
	const logStream = fs.createWriteStream(outputPath, {flags: 'w'});

	function log(message: string) {
		logStream.write(message + '\n');
	}

	try {
		await connectDB();
		log('Connected to database');

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

		log('=== Job Queue Status ===');
		log(`- Pending: ${pendingCount}`);
		log(`- Processing: ${processingCount}`);
		log(`- Completed: ${completedCount}`);
		log(`- Failed: ${failedCount}`);

		// List some recent jobs
		log('\n=== Recent Jobs ===');
		const recentJobs = await JobQueue.find().sort({updatedAt: -1}).limit(5);
		recentJobs.forEach(job => {
			log(
				`- ID: ${job._id}, Status: ${job.status}, Last Updated: ${job.updatedAt}`,
			);
		});

		// Total count
		const totalJobs = await JobQueue.countDocuments();
		log(`\nTotal jobs in queue: ${totalJobs}`);

		await disconnectDB();
		log('Disconnected from database');
		logStream.end();

		console.log(`Results written to ${outputPath}`);
	} catch (error: any) {
		log(`Error checking queue status: ${error.message}`);
		logStream.end();
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
