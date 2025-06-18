#!/usr/bin/env tsx

/**
 * Quick queue status check
 */

console.log('📊 Checking queue status...');

import mongoose from 'mongoose';
import {JobQueue, JobStatus} from '../models/JobQueue';

const MONGODB_URI =
	process.env.MONGODB_URI || 'mongodb://mongodb:27017/scoutly';

async function checkQueueStatus() {
	try {
		await mongoose.connect(MONGODB_URI, {
			serverSelectionTimeoutMS: 5000,
			connectTimeoutMS: 5000,
		});

		const totalCount = await JobQueue.countDocuments();
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

		console.log('📂 QUEUE STATUS');
		console.log('══════════════');
		console.log(`Total Jobs: ${totalCount}`);
		console.log(`• Pending: ${pendingCount}`);
		console.log(`• Processing: ${processingCount}`);
		console.log(`• Completed: ${completedCount}`);
		console.log(`• Failed: ${failedCount}`);

		// Get a few example jobs
		if (totalCount > 0) {
			console.log('\nEXAMPLE JOBS:');
			const jobs = await JobQueue.find().limit(3).populate('companyId');

			for (const job of jobs) {
				const company = job.companyId as any;
				console.log(`• ${company?.company || 'Unknown'} (${job.status})`);
			}
		}

		await mongoose.disconnect();
	} catch (error: any) {
		console.error('Error:', error.message);
	}
}

checkQueueStatus();
