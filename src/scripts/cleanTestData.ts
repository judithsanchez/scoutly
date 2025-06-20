#!/usr/bin/env tsx

/**
 * Clean Test Data Script
 *
 * This script removes all test data from the database except for companies.
 * It's used to prepare for a fresh start with the background jobs system.
 *
 * Usage: npx tsx src/scripts/cleanTestData.ts
 */

import {connectDB, disconnectDB} from '../config/database';
import {EnhancedLogger} from '../utils/enhancedLogger';

const logger = EnhancedLogger.getLogger('CleanTestData', {
	logToFile: true,
	logToConsole: true,
	logDir: '/tmp/scoutly-logs',
	logFileName: 'clean-test-data.log',
});

// Create log directory if it doesn't exist
import fs from 'fs';
if (!fs.existsSync('/tmp/scoutly-logs')) {
	fs.mkdirSync('/tmp/scoutly-logs', {recursive: true});
	console.log('Created log directory at /tmp/scoutly-logs');
}

async function cleanTestData() {
	try {
		logger.info('🧹 Starting cleanup of test data...');
		await connectDB();

		// Use MongoDB driver directly for more control
		const db = (global as any).mongooseConnection.db;

		// Delete all job queue entries
		const jobQueueResult = await db.collection('jobqueues').deleteMany({});
		logger.info(`✓ Deleted ${jobQueueResult.deletedCount} job queue entries`);

		// Delete all saved jobs
		const savedJobsResult = await db.collection('savedjobs').deleteMany({});
		logger.info(`✓ Deleted ${savedJobsResult.deletedCount} saved jobs`);

		// Delete all user data
		const usersResult = await db.collection('users').deleteMany({});
		logger.info(`✓ Deleted ${usersResult.deletedCount} users`);

		// Delete all user company preferences
		const preferencesResult = await db
			.collection('usercompanypreferences')
			.deleteMany({});
		logger.info(
			`✓ Deleted ${preferencesResult.deletedCount} user company preferences`,
		);

		// Delete all token usage records
		const tokenUsageResult = await db.collection('tokenusages').deleteMany({});
		logger.info(
			`✓ Deleted ${tokenUsageResult.deletedCount} token usage records`,
		);

		// Delete all scrape history
		const scrapeHistoryResult = await db
			.collection('companyscrapehistories')
			.deleteMany({});
		logger.info(
			`✓ Deleted ${scrapeHistoryResult.deletedCount} company scrape histories`,
		);

		// Keep all companies as requested
		const companyCount = await db.collection('companies').countDocuments();
		logger.info(`✓ Kept all ${companyCount} companies in the database`);

		logger.success('🎉 Database cleanup complete! Ready for fresh start.');
	} catch (error: any) {
		logger.error('Failed to clean test data:', error);
		process.exit(1);
	} finally {
		await disconnectDB();
	}
}

// Run the cleanup
cleanTestData()
	.then(() => {
		logger.info('Script execution complete');
		process.exit(0);
	})
	.catch(error => {
		logger.error('Script failed:', error);
		process.exit(1);
	});
