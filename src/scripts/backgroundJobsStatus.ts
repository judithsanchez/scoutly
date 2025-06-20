#!/usr/bin/env tsx

/**
 * Background Jobs Status Script
 *
 * This script provides a comprehensive overview of the background jobs system,
 * including queue status, company preferences, and recent activity.
 *
 * Usage: npx tsx src/scripts/backgroundJobsStatus.ts
 */

import {connectDB, disconnectDB} from '../config/database';
import {Company} from '../models/Company';
import {UserCompanyPreference} from '../models/UserCompanyPreference';
import {JobQueue, JobStatus} from '../models/JobQueue';
import {UserCompanyPreferenceService} from '../services/userCompanyPreferenceService';
import {
	calculateAnacronPriority,
	isCompanyDueForScraping,
} from '../utils/scrapeScheduling';
import { EnhancedLogger } from '../utils/enhancedLogger';

const logger = EnhancedLogger.getLogger('BackgroundJobsStatus', {
  logToFile: true,
  logToConsole: true,
  logDir: '/tmp/scoutly-logs',
  logFileName: 'BackgroundJobsStatus.log'.toLowerCase()
});

// Default user for status checking
const DEFAULT_USER_ID = 'judithv.sanchezc@gmail.com';

async function getSystemStatus() {
	try {
		logger.info('📊 Checking background jobs system status...');
		await connectDB();

		// Job Queue Status
		const queueStats = await getQueueStatus();

		// User Preferences Status
		const userStats = await getUserPreferencesStatus();

		// Company Status
		const companyStats = await getCompanyStatus();

		// Due for Scraping
		const scrapeStatus = await getScrapeStatus();

		// Display comprehensive status
		displayStatus({
			queue: queueStats,
			user: userStats,
			companies: companyStats,
			scraping: scrapeStatus,
		});
	} catch (error: any) {
		logger.error('💥 Failed to get system status:', error);
		throw error;
	} finally {
		await disconnectDB();
	}
}

async function getQueueStatus() {
	const [pending, processing, completed, failed] = await Promise.all([
		JobQueue.countDocuments({status: JobStatus.PENDING}),
		JobQueue.countDocuments({status: JobStatus.PROCESSING}),
		JobQueue.countDocuments({status: JobStatus.COMPLETED}),
		JobQueue.countDocuments({status: JobStatus.FAILED}),
	]);

	// Recent completed jobs
	const recentCompleted = await JobQueue.find({status: JobStatus.COMPLETED})
		.sort({updatedAt: -1})
		.limit(5)
		.populate('companyId', 'company');

	// Failed jobs with retry counts
	const failedJobs = await JobQueue.find({status: JobStatus.FAILED})
		.sort({updatedAt: -1})
		.limit(10)
		.populate('companyId', 'company');

	return {
		pending,
		processing,
		completed,
		failed,
		total: pending + processing + completed + failed,
		recentCompleted,
		failedJobs,
	};
}

async function getUserPreferencesStatus() {
	const stats = await UserCompanyPreferenceService.getTrackingStats(
		DEFAULT_USER_ID,
	);

	const trackedCompanies =
		await UserCompanyPreferenceService.getTrackedCompanies(DEFAULT_USER_ID);

	// Top priority companies
	const topPriority = trackedCompanies
		.sort((a, b) => b.userPreference.rank - a.userPreference.rank)
		.slice(0, 10);

	return {
		...stats,
		topPriority,
	};
}

async function getCompanyStatus() {
	const [total, problematic, neverScraped, recentlyScraped] = await Promise.all(
		[
			Company.countDocuments(),
			Company.countDocuments({isProblematic: true}),
			Company.countDocuments({lastSuccessfulScrape: {$exists: false}}),
			Company.find({lastSuccessfulScrape: {$exists: true}})
				.sort({lastSuccessfulScrape: -1})
				.limit(5)
				.select('company lastSuccessfulScrape'),
		],
	);

	return {
		total,
		problematic,
		neverScraped,
		recentlyScraped,
	};
}

async function getScrapeStatus() {
	// Get all tracked companies with their scrape status
	const userPreferences = await UserCompanyPreference.find({
		userId: DEFAULT_USER_ID,
		isTracking: true,
	}).populate('companyId');

	const companiesWithStatus = userPreferences.map(pref => {
		const company = pref.companyId as any;
		const isDue = isCompanyDueForScraping(
			pref.rank,
			company.lastSuccessfulScrape,
		);
		const priority = calculateAnacronPriority(
			pref.rank,
			company.lastSuccessfulScrape,
		);

		return {
			company: company.company,
			rank: pref.rank,
			lastScrape: company.lastSuccessfulScrape,
			isDue,
			priority,
			isProblematic: company.isProblematic,
		};
	});

	const dueForScraping = companiesWithStatus.filter(c => c.isDue);
	const overdue = companiesWithStatus.filter(c => c.isDue && c.lastScrape);
	const neverScraped = companiesWithStatus.filter(c => !c.lastScrape);

	// Sort by priority for anacron processing
	const sortedByPriority = [...dueForScraping].sort(
		(a, b) => b.priority - a.priority,
	);

	return {
		totalTracked: companiesWithStatus.length,
		dueForScraping: dueForScraping.length,
		overdue: overdue.length,
		neverScraped: neverScraped.length,
		topPriorityDue: sortedByPriority.slice(0, 10),
	};
}

function displayStatus(status: any) {
	logger.info('');
	logger.info('🎯 BACKGROUND JOBS SYSTEM STATUS');
	logger.info('═══════════════════════════════════');

	// Job Queue Status
	logger.info('');
	logger.info('📋 JOB QUEUE STATUS');
	logger.info('───────────────────');
	logger.info(`   Total Jobs: ${status.queue.total}`);
	logger.info(`   • Pending: ${status.queue.pending}`);
	logger.info(`   • Processing: ${status.queue.processing}`);
	logger.info(`   • Completed: ${status.queue.completed}`);
	logger.info(`   • Failed: ${status.queue.failed}`);

	if (status.queue.recentCompleted.length > 0) {
		logger.info('');
		logger.info('   Recent Completed Jobs:');
		status.queue.recentCompleted.forEach((job: any) => {
			const company = job.companyId?.company || 'Unknown';
			const time = job.updatedAt.toLocaleString();
			logger.info(`   • ${company} (${time})`);
		});
	}

	if (status.queue.failedJobs.length > 0) {
		logger.info('');
		logger.info('   Failed Jobs:');
		status.queue.failedJobs.forEach((job: any) => {
			const company = job.companyId?.company || 'Unknown';
			const retries = job.retryCount || 0;
			logger.info(`   • ${company} (${retries} retries)`);
		});
	}

	// User Preferences Status
	logger.info('');
	logger.info('👤 USER PREFERENCES STATUS');
	logger.info('──────────────────────────');
	logger.info(`   Tracked Companies: ${status.user.totalTracked}`);
	logger.info(`   Average Rank: ${status.user.averageRank}`);
	logger.info('');
	logger.info('   Frequency Distribution:');
	Object.entries(status.user.byFrequency).forEach(([frequency, count]) => {
		logger.info(`   • ${frequency}: ${count} companies`);
	});

	if (status.user.topPriority.length > 0) {
		logger.info('');
		logger.info('   Top Priority Companies:');
		status.user.topPriority.slice(0, 5).forEach((company: any) => {
			logger.info(
				`   • ${company.company} (rank: ${company.userPreference.rank})`,
			);
		});
	}

	// Company Status
	logger.info('');
	logger.info('🏢 COMPANY STATUS');
	logger.info('─────────────────');
	logger.info(`   Total Companies: ${status.companies.total}`);
	logger.info(`   • Problematic: ${status.companies.problematic}`);
	logger.info(`   • Never Scraped: ${status.companies.neverScraped}`);

	if (status.companies.recentlyScraped.length > 0) {
		logger.info('');
		logger.info('   Recently Scraped:');
		status.companies.recentlyScraped.forEach((company: any) => {
			const time = company.lastSuccessfulScrape.toLocaleString();
			logger.info(`   • ${company.company} (${time})`);
		});
	}

	// Scraping Status
	logger.info('');
	logger.info('🔄 SCRAPING STATUS');
	logger.info('──────────────────');
	logger.info(`   Total Tracked: ${status.scraping.totalTracked}`);
	logger.info(`   • Due for Scraping: ${status.scraping.dueForScraping}`);
	logger.info(`   • Overdue: ${status.scraping.overdue}`);
	logger.info(`   • Never Scraped: ${status.scraping.neverScraped}`);

	if (status.scraping.topPriorityDue.length > 0) {
		logger.info('');
		logger.info('   Next Companies to Process (by priority):');
		status.scraping.topPriorityDue.slice(0, 5).forEach((company: any) => {
			const lastScrape = company.lastScrape
				? company.lastScrape.toLocaleDateString()
				: 'Never';
			const problematic = company.isProblematic ? ' ⚠️' : '';
			logger.info(
				`   • ${company.company} (rank: ${company.rank}, last: ${lastScrape})${problematic}`,
			);
		});
	}

	// System Recommendations
	logger.info('');
	logger.info('💡 RECOMMENDATIONS');
	logger.info('──────────────────');

	if (status.queue.failed > 0) {
		logger.info('   • Review failed jobs - some companies may need attention');
	}

	if (status.scraping.dueForScraping > 20) {
		logger.info(
			'   • Consider running processQueue.ts to catch up on scraping',
		);
	}

	if (status.companies.problematic > 0) {
		logger.info(
			'   • Review problematic companies - they may need manual intervention',
		);
	}

	if (status.scraping.neverScraped > 10) {
		logger.info(
			'   • Many companies have never been scraped - consider initial batch processing',
		);
	}

	logger.info('');
}

// Main execution
if (require.main === module) {
	getSystemStatus()
		.then(() => {
			logger.info('🏁 Status check completed successfully');
			process.exit(0);
		})
		.catch(error => {
			logger.error('💥 Status check failed:', error);
			process.exit(1);
		});
}

export {getSystemStatus};
