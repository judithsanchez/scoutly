#!/usr/bin/env tsx

/**
 * Quick Reset Script for Manual Testing
 *
 * This script quickly clears all CompanyScrapeHistory and SavedJobs records
 * to reset the system for fresh manual testing.
 *
 * Usage: npm run reset-for-testing
 */

import dbConnect from '../middleware/database';
import {CompanyScrapeHistory} from '../models/CompanyScrapeHistory';
import {SavedJob} from '../models/SavedJob';
import {Logger} from '../utils/logger';

const logger = new Logger('ResetForTesting');

async function resetForTesting(): Promise<void> {
	try {
		logger.info('🚀 Starting complete reset for manual testing...');
		logger.info('🔌 Connecting to database...');
		await dbConnect();

		// Clear CompanyScrapeHistory
		logger.info('🔍 Checking company scrape history...');
		const scrapeHistoryCount = await CompanyScrapeHistory.countDocuments();
		logger.info(`Found ${scrapeHistoryCount} scrape history records`);

		if (scrapeHistoryCount > 0) {
			logger.info('🗑️ Clearing company scrape history...');
			const scrapeResult = await CompanyScrapeHistory.deleteMany({});
			logger.success(
				`✅ Deleted ${scrapeResult.deletedCount} scrape history records`,
			);
		} else {
			logger.info('✅ No scrape history to clear');
		}

		// Clear SavedJobs
		logger.info('🔍 Checking saved jobs...');
		const savedJobsCount = await SavedJob.countDocuments();
		logger.info(`Found ${savedJobsCount} saved job records`);

		if (savedJobsCount > 0) {
			logger.info('🗑️ Clearing saved jobs...');
			const jobsResult = await SavedJob.deleteMany({});
			logger.success(`✅ Deleted ${jobsResult.deletedCount} saved job records`);
		} else {
			logger.info('✅ No saved jobs to clear');
		}

		logger.success('🎉 Complete reset finished!');
		logger.info('📋 System state:');
		logger.info(
			'   • CompanyScrapeHistory: CLEARED - all companies can be re-scraped',
		);
		logger.info('   • SavedJobs: CLEARED - fresh start for job saving');
		logger.info('   • Ready for manual testing with clean slate!');
	} catch (error: any) {
		logger.error('❌ Reset failed:', {
			message: error.message,
			stack: error.stack,
		});
		process.exit(1);
	}
}

// Main execution
if (require.main === module) {
	resetForTesting()
		.then(() => {
			logger.info('🏁 Reset script completed successfully');
			process.exit(0);
		})
		.catch(error => {
			logger.error('Script failed:', error);
			process.exit(1);
		});
}

export {resetForTesting};
