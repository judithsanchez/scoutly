#!/usr/bin/env tsx

/**
 * Job Queue Worker Script - Background Job Processor
 *
 * This script continuously processes jobs from the queue, running the job matching
 * orchestrator for each company. Designed for both continuous operation (Raspberry Pi)
 * and batch processing (laptop/desktop with anacron).
 *
 * Usage: npx tsx src/scripts/processQueue.ts
 */

import {connectDB, disconnectDB} from '../config/database';
import {Company} from '../models/Company';
import {UserCompanyPreference} from '../models/UserCompanyPreference';
import {JobQueue, JobStatus, IJobQueue} from '../models/JobQueue';
import {JobMatchingOrchestrator} from '../services/jobMatchingOrchestrator';
import {UserService} from '../services/userService';
import {SimpleLogger} from '../utils/simpleLogger';

const logger = new SimpleLogger('QueueWorker');

// Configuration
const BATCH_SIZE = 5; // Process up to 5 companies concurrently (Raspberry Pi optimized)
const POLL_INTERVAL = 20000; // 20 seconds between queue checks
const MAX_PROCESSING_TIME = 10 * 60 * 1000; // 10 minutes max per job

// Default user configuration - In production, this should be configurable
const DEFAULT_USER_EMAIL = 'judithv.sanchezc@gmail.com';
const DEFAULT_CV_URL =
	'https://drive.google.com/file/d/1-0NUsEx0HmnTmcpMOjGSKdOJJ1Vd_uWL/view?usp=drive_link';

// Default candidate info - should match the structure expected by JobMatchingOrchestrator
const DEFAULT_CANDIDATE_INFO = {
	logistics: {
		currentResidence: {
			city: 'Madrid',
			country: 'Spain',
			countryCode: 'ES',
			timezone: 'Europe/Madrid',
		},
		willingToRelocate: true,
		workAuthorization: [
			{
				region: 'Europe',
				regionCode: 'EU',
				status: 'authorized',
			},
		],
	},
	skills: {
		languages: [
			{language: 'English', level: 'fluent'},
			{language: 'Spanish', level: 'native'},
		],
		technologies: ['TypeScript', 'React', 'Node.js', 'MongoDB'],
		industries: ['Technology', 'Software Development'],
		roleTypes: ['Full-time', 'Remote'],
	},
	preferences: {
		workEnvironments: ['Remote', 'Hybrid'],
		companySizes: ['Startup', 'Scale-up', 'Enterprise'],
		exclusions: {
			industries: [],
			technologies: [],
			roleTypes: ['Internship'],
		},
	},
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function processQueue() {
	logger.info('🚀 Starting queue worker...');
	await connectDB();

	const orchestrator = new JobMatchingOrchestrator();
	let isShuttingDown = false;

	// Graceful shutdown handling
	process.on('SIGINT', () => {
		logger.info('📴 Received SIGINT, initiating graceful shutdown...');
		isShuttingDown = true;
	});

	process.on('SIGTERM', () => {
		logger.info('📴 Received SIGTERM, initiating graceful shutdown...');
		isShuttingDown = true;
	});

	while (!isShuttingDown) {
		try {
			// Find pending jobs, sorted by creation time (FIFO)
			const pendingJobs = await JobQueue.find({
				status: JobStatus.PENDING,
			})
				.sort({createdAt: 1})
				.limit(BATCH_SIZE)
				.populate('companyId');

			if (pendingJobs.length === 0) {
				logger.debug('📭 No pending jobs found. Waiting...');
				await sleep(POLL_INTERVAL);
				continue;
			}

			logger.info(`📋 Processing batch of ${pendingJobs.length} jobs`);

			// Process jobs in parallel
			await Promise.all(pendingJobs.map(job => processJob(job, orchestrator)));
		} catch (error: any) {
			logger.error('💥 Error in main worker loop:', error);
			await sleep(5000); // Wait before retrying
		}
	}

	logger.info('🛑 Worker shutting down gracefully...');
	await disconnectDB();
}

async function processJob(
	job: IJobQueue,
	orchestrator: JobMatchingOrchestrator,
): Promise<void> {
	const startTime = Date.now();
	let company: any = null;

	try {
		company = job.companyId as any;

		if (!company) {
			throw new Error('Company not found for job');
		}

		// Mark job as processing
		job.status = JobStatus.PROCESSING;
		job.lastAttemptAt = new Date();
		await job.save();

		logger.info(`🔄 Processing job for company: ${company.company}`);

		// Get or create user
		const user = await UserService.getOrCreateUser(
			DEFAULT_USER_EMAIL,
			DEFAULT_CV_URL,
			DEFAULT_CANDIDATE_INFO as any,
		);

		// Run the job matching orchestrator
		const results = (await Promise.race([
			orchestrator.orchestrateJobMatching(
				company,
				DEFAULT_CV_URL,
				DEFAULT_CANDIDATE_INFO,
				user.email,
			),
			// Timeout protection
			new Promise((_, reject) =>
				setTimeout(() => reject(new Error('Job timeout')), MAX_PROCESSING_TIME),
			),
		])) as any[];

		// Update company's last successful scrape timestamp
		await Company.updateOne(
			{_id: company._id},
			{$set: {lastSuccessfulScrape: new Date()}},
		);

		// Mark job as completed
		job.status = JobStatus.COMPLETED;
		await job.save();

		const duration = Date.now() - startTime;
		logger.success(
			`✅ Completed job for ${company.company} in ${Math.round(
				duration / 1000,
			)}s (found ${results.length} matches)`,
		);
	} catch (error: any) {
		const duration = Date.now() - startTime;
		logger.error(
			`❌ Job failed for ${company?.company || 'unknown'} after ${Math.round(
				duration / 1000,
			)}s:`,
			error.message,
		);

		try {
			// Mark job as failed and increment retry count
			job.status = JobStatus.FAILED;
			job.retryCount = (job.retryCount || 0) + 1;
			await job.save();

			// Mark company as problematic if it fails repeatedly
			if (job.retryCount >= 3 && company) {
				await Company.updateOne(
					{_id: company._id},
					{$set: {isProblematic: true}},
				);
				logger.warn(
					`🚨 Marked ${company.company} as problematic after ${job.retryCount} failures`,
				);
			}
		} catch (saveError: any) {
			logger.error('💥 Failed to update job status:', saveError);
		}
	}
}

// For anacron mode - process all available jobs once then exit
async function processAllJobs(): Promise<void> {
	logger.info('🔄 Running in anacron mode - processing all available jobs...');
	await connectDB();

	const orchestrator = new JobMatchingOrchestrator();
	let totalProcessed = 0;

	try {
		while (true) {
			const pendingJobs = await JobQueue.find({
				status: JobStatus.PENDING,
			})
				.sort({createdAt: 1})
				.limit(BATCH_SIZE)
				.populate('companyId');

			if (pendingJobs.length === 0) {
				break;
			}

			logger.info(
				`📋 Processing batch of ${pendingJobs.length} jobs (total processed: ${totalProcessed})`,
			);

			// Process jobs in parallel
			await Promise.all(pendingJobs.map(job => processJob(job, orchestrator)));

			totalProcessed += pendingJobs.length;

			// Small delay between batches to prevent overwhelming the system
			await sleep(2000);
		}

		logger.success(
			`✅ Anacron processing completed. Processed ${totalProcessed} jobs.`,
		);
	} finally {
		await disconnectDB();
	}
}

// Main execution
if (require.main === module) {
	const isAnacronMode = process.argv.includes('--anacron');

	if (isAnacronMode) {
		processAllJobs()
			.then(() => {
				logger.info('🏁 Anacron worker completed successfully');
				process.exit(0);
			})
			.catch(error => {
				logger.error('💥 Anacron worker failed:', error);
				process.exit(1);
			});
	} else {
		processQueue()
			.then(() => {
				logger.info('🏁 Worker completed successfully');
				process.exit(0);
			})
			.catch(error => {
				logger.error('💥 Worker failed:', error);
				process.exit(1);
			});
	}
}

export {processQueue, processAllJobs};
