#!/usr/bin/env tsx

/**
 * Quick script to clear company scrape history
 *
 * This will allow companies to be re-scraped and find "new" jobs
 *
 * Usage: npx tsx src/scripts/clearScrapeHistory.ts
 */

import {connectToDatabase} from '../lib/mongodb';
import {CompanyScrapeHistory} from '../models/CompanyScrapeHistory';
import {Logger} from '../utils/logger';

const logger = new Logger('ClearScrapeHistory');

async function clearScrapeHistory(): Promise<void> {
	try {
		logger.info('🚀 Connecting to database...');
		await connectToDatabase();

		logger.info('🔍 Checking current scrape history...');
		const count = await CompanyScrapeHistory.countDocuments();
		logger.info(`Found ${count} scrape history records`);

		if (count === 0) {
			logger.info(
				'✅ No scrape history records to delete - database is already clean!',
			);
			return;
		}

		logger.info('🗑️ Clearing all company scrape history...');
		const result = await CompanyScrapeHistory.deleteMany({});

		logger.success(
			`✅ Successfully deleted ${result.deletedCount} scrape history records`,
		);
		logger.success('🎉 Companies can now be re-scraped for "new" jobs!');
	} catch (error) {
		logger.error('❌ Error clearing scrape history:', error);
		process.exit(1);
	}
}

// Main execution
if (require.main === module) {
	clearScrapeHistory()
		.then(() => {
			logger.info('🏁 Script completed successfully');
			process.exit(0);
		})
		.catch(error => {
			logger.error('Script failed:', error);
			process.exit(1);
		});
}

export {clearScrapeHistory};
