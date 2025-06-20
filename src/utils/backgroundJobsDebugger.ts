#!/usr/bin/env tsx

/**
 * Background Jobs Pipeline Debugger
 *
 * A diagnostic tool for the background jobs pipeline that helps identify issues
 * with job processing, especially around job saving and API integration.
 *
 * Usage: npx tsx src/utils/backgroundJobsDebugger.ts [--test-pipeline]
 * Options:
 *   --test-pipeline: Run an actual test with a company through the pipeline
 */

import {connectDB, disconnectDB} from '../config/database';
import {Company} from '../models/Company';
import {JobQueue, JobStatus} from '../models/JobQueue';
import {SavedJob} from '../models/SavedJob';
import {UserService} from '../services/userService';
import {JobMatchingOrchestrator} from '../services/jobMatchingOrchestrator';
import {EnhancedLogger} from './enhancedLogger';

// Configure enhanced logging
const logger = EnhancedLogger.getLogger('JobsDebugger', {
	logToFile: true,
	logToConsole: true,
	logDir: '/tmp/scoutly-logs',
	logFileName: 'jobs-debugger.log',
});

// Configuration
const DEBUG_MODE = true;
const TARGET_USER_EMAIL = 'judithv.sanchezc@gmail.com';
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

/**
 * Verify the Gemini API Key configuration
 */
async function verifyApiKey(): Promise<boolean> {
	logger.info('🔑 Verifying GEMINI_API_KEY configuration');

	const apiKey = process.env.GEMINI_API_KEY;

	if (!apiKey) {
		logger.error('❌ GEMINI_API_KEY environment variable is not set');
		logger.info(
			'📝 Add GEMINI_API_KEY to your .env file and restart Docker if needed',
		);
		return false;
	}

	logger.info(`✅ GEMINI_API_KEY is set (length: ${apiKey.length})`);

	// This is a basic verification that doesn't make an actual API call
	// A proper verification would involve making a test call to the Gemini API
	const isValidFormat = apiKey.length > 10 && apiKey.startsWith('AI');

	if (!isValidFormat) {
		logger.warn('⚠️ GEMINI_API_KEY does not appear to have a valid format');
		logger.info(
			'📝 Gemini API keys typically start with "AI" and are fairly long',
		);
	} else {
		logger.info('✅ GEMINI_API_KEY appears to have a valid format');
	}

	return isValidFormat;
}

/**
 * Analyze the job queue status
 */
async function analyzeJobQueue() {
	logger.info('📊 Analyzing job queue status');

	try {
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

		logger.info(
			`📈 Job Queue Stats: ${pendingCount} pending, ${processingCount} processing, ${completedCount} completed, ${failedCount} failed`,
		);

		// Check for stuck jobs (processing for more than 30 minutes)
		const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
		const stuckJobs = await JobQueue.find({
			status: JobStatus.PROCESSING,
			lastAttemptAt: {$lt: thirtyMinutesAgo},
		}).populate('companyId');

		if (stuckJobs.length > 0) {
			logger.warn(
				`🚨 Found ${stuckJobs.length} stuck jobs (processing for >30 minutes)`,
			);

			for (const job of stuckJobs) {
				const company = job.companyId as any;
				logger.warn(
					`⏱️ Stuck job for "${company?.company || 'Unknown'}" since ${
						job.lastAttemptAt
					}`,
				);

				// Reset stuck job to pending
				if (DEBUG_MODE) {
					logger.info(`🔄 Resetting stuck job ${job.id} to pending status`);
					await JobQueue.updateOne(
						{_id: job.id},
						{$set: {status: JobStatus.PENDING}},
					);
				}
			}
		} else {
			logger.info('✅ No stuck jobs found');
		}

		return {
			pendingCount,
			processingCount,
			completedCount,
			failedCount,
			stuckJobs,
		};
	} catch (error: any) {
		logger.error('❌ Error analyzing job queue:', error);
		throw error;
	}
}

/**
 * Check saved jobs for a user
 */
async function checkUserSavedJobs(userEmail: string) {
	logger.info(`👤 Checking saved jobs for user: ${userEmail}`);

	try {
		const user = await UserService.getUserByEmail(userEmail);

		if (!user) {
			logger.error(`❌ User not found: ${userEmail}`);
			return null;
		}

		const savedJobs = await SavedJob.find({user: user.id}).populate('company');

		logger.info(`📝 Found ${savedJobs.length} saved jobs for ${userEmail}`);

		// Display the most recent saved jobs
		if (savedJobs.length > 0) {
			const recentJobs = savedJobs
				.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
				.slice(0, 5);

			logger.info('📋 Most recent saved jobs:');
			recentJobs.forEach((job: any, index: number) => {
				const company = job.company as any;
				logger.info(
					`   ${index + 1}. "${job.title}" at ${
						company?.company || 'Unknown'
					} (${job.createdAt.toISOString()})`,
				);
			});
		}

		return {
			user,
			savedJobsCount: savedJobs.length,
			savedJobs,
		};
	} catch (error: any) {
		logger.error('❌ Error checking saved jobs:', error);
		throw error;
	}
}

/**
 * Test the pipeline with a single company
 */
async function testPipeline(userEmail: string) {
	logger.info('🧪 Testing pipeline with a single company');

	try {
		// Verify API key before proceeding
		if (!(await verifyApiKey())) {
			logger.error('❌ Cannot proceed with invalid API key');
			return null;
		}

		// Get a good test company
		const company = await Company.findOne({
			careers_url: {$exists: true},
			careers_url: {$ne: null},
			isProblematic: {$ne: true},
		});

		if (!company) {
			logger.error('❌ No suitable test company found');
			return null;
		}

		logger.info(`🏢 Selected test company: ${company.company}`);
		logger.info(`🔗 Careers URL: ${company.careers_url}`);

		// Get user
		const user = await UserService.getUserByEmail(userEmail);
		if (!user) {
			logger.error(`❌ User not found: ${userEmail}`);
			return null;
		}

		// Initialize orchestrator
		const orchestrator = new JobMatchingOrchestrator();

		// Get current saved job count
		const beforeCount = await SavedJob.countDocuments({user: user.id});
		logger.info(`📊 User has ${beforeCount} saved jobs before test`);

		// Force pipeline to be used (using the public API)
		if (DEBUG_MODE) {
			logger.info('🔧 Forcing pipeline architecture to be used');
			orchestrator.setPipelineEnabled(true);

			// Get the current architecture info
			const archInfo = orchestrator.getArchitectureInfo();
			logger.info(`🏗️ Architecture info: ${JSON.stringify(archInfo)}`);
		}

		// Run the orchestrator
		logger.info('🚀 Starting job matching orchestration');
		const startTime = Date.now();

		try {
			const results = await orchestrator.orchestrateJobMatching(
				company,
				DEFAULT_CV_URL,
				DEFAULT_CANDIDATE_INFO,
				userEmail,
			);

			const duration = (Date.now() - startTime) / 1000;
			logger.success(`✅ Job matching completed in ${duration.toFixed(1)}s`);

			// Check results
			logger.info(
				`📊 Results: ${results ? results.length : 0} job matches found`,
			);

			// Check if any new jobs were saved
			const afterCount = await SavedJob.countDocuments({user: user.id});
			const newJobsCount = afterCount - beforeCount;

			logger.info(
				`📈 User now has ${afterCount} saved jobs (${newJobsCount} new)`,
			);

			if (newJobsCount > 0) {
				logger.success('✅ Pipeline successfully saved new jobs');
			} else {
				logger.warn(
					'⚠️ No new jobs were saved - there may be an issue with the pipeline',
				);

				// Show the most recent jobs to check if they match the test company
				const recentJobs = await SavedJob.find({user: user.id})
					.sort({createdAt: -1})
					.limit(5)
					.populate('company');

				if (recentJobs.length > 0) {
					logger.info('📋 Most recent jobs:');
					recentJobs.forEach((job: any, index: number) => {
						const jobCompany = job.company as any;
						logger.info(
							`   ${index + 1}. "${job.title}" at ${
								jobCompany?.company || 'Unknown'
							} (${job.createdAt.toISOString()})`,
						);
					});
				}
			}

			return {
				company,
				results,
				beforeCount,
				afterCount,
				newJobsCount,
				duration,
			};
		} catch (error: any) {
			logger.error('❌ Error in job matching orchestration:', error);
			logger.error('🔍 Error details:', error.stack);
			return null;
		}
	} catch (error: any) {
		logger.error('❌ Error testing pipeline:', error);
		throw error;
	}
}

/**
 * Reset stuck jobs to pending
 */
async function resetStuckJobs() {
	logger.info('🔄 Checking for stuck jobs to reset');

	try {
		const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

		const result = await JobQueue.updateMany(
			{status: JobStatus.PROCESSING, lastAttemptAt: {$lt: thirtyMinutesAgo}},
			{$set: {status: JobStatus.PENDING}},
		);

		if (result.modifiedCount > 0) {
			logger.success(
				`✅ Reset ${result.modifiedCount} stuck jobs to pending status`,
			);
		} else {
			logger.info('✓ No stuck jobs found to reset');
		}

		return result.modifiedCount;
	} catch (error: any) {
		logger.error('❌ Error resetting stuck jobs:', error);
		throw error;
	}
}

/**
 * Main debugging function
 */
async function main() {
	logger.info('🔍 Starting background jobs debugger');

	try {
		await connectDB();

		// Verify API key
		await verifyApiKey();

		// Reset any stuck jobs
		await resetStuckJobs();

		// Analyze job queue
		await analyzeJobQueue();

		// Check user saved jobs
		await checkUserSavedJobs(TARGET_USER_EMAIL);

		// Test pipeline if specified
		if (process.argv.includes('--test-pipeline')) {
			await testPipeline(TARGET_USER_EMAIL);
		}

		logger.success('✅ Background jobs debug analysis completed');
	} catch (error: any) {
		logger.error('❌ Background jobs debugger failed:', error);
	} finally {
		await disconnectDB();
	}
}

// Run the debugger
if (require.main === module) {
	main()
		.then(() => {
			logger.info('🏁 Debugger completed successfully');
			process.exit(0);
		})
		.catch(error => {
			logger.error('💥 Debugger failed:', error);
			process.exit(1);
		});
}

export {
	verifyApiKey,
	analyzeJobQueue,
	checkUserSavedJobs,
	testPipeline,
	resetStuckJobs,
};
