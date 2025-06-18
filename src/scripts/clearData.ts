#!/usr/bin/env tsx

/**
 * Utility script to clear CompanyScrapeHistory and SavedJobs records
 *
 * This script allows you to:
 * 1. Clear all scrape history (so companies can be re-scraped)
 * 2. Clear saved jobs for a specific user
 * 3. Clear saved jobs for all users
 *
 * Usage:
 * - Clear all scrape history: npx tsx src/scripts/clearData.ts --scrape-history
 * - Clear saved jobs for user: npx tsx src/scripts/clearData.ts --saved-jobs --user your@email.com
 * - Clear all saved jobs: npx tsx src/scripts/clearData.ts --saved-jobs --all
 * - Clear everything: npx tsx src/scripts/clearData.ts --all
 */

import dbConnect from '../middleware/database';
import {CompanyScrapeHistory} from '../models/CompanyScrapeHistory';
import {SavedJob} from '../models/SavedJob';
import {Logger} from '../utils/logger';

const logger = new Logger('ClearDataScript');

interface ClearDataOptions {
	scrapeHistory: boolean;
	savedJobs: boolean;
	userEmail?: string;
	all: boolean;
}

async function clearScrapeHistory(): Promise<void> {
	logger.info('🗑️ Clearing all company scrape history...');

	const count = await CompanyScrapeHistory.countDocuments();
	logger.info(`Found ${count} scrape history records`);

	if (count === 0) {
		logger.info('No scrape history records to delete');
		return;
	}

	const result = await CompanyScrapeHistory.deleteMany({});
	logger.success(`✅ Deleted ${result.deletedCount} scrape history records`);
}

async function clearSavedJobs(userEmail?: string): Promise<void> {
	if (userEmail) {
		logger.info(`🗑️ Clearing saved jobs for user: ${userEmail}`);

		const count = await SavedJob.countDocuments({user: userEmail});
		logger.info(`Found ${count} saved jobs for user ${userEmail}`);

		if (count === 0) {
			logger.info(`No saved jobs found for user ${userEmail}`);
			return;
		}

		const result = await SavedJob.deleteMany({user: userEmail});
		logger.success(
			`✅ Deleted ${result.deletedCount} saved jobs for user ${userEmail}`,
		);
	} else {
		logger.info('🗑️ Clearing ALL saved jobs...');

		const count = await SavedJob.countDocuments();
		logger.info(`Found ${count} saved jobs total`);

		if (count === 0) {
			logger.info('No saved jobs to delete');
			return;
		}

		const result = await SavedJob.deleteMany({});
		logger.success(`✅ Deleted ${result.deletedCount} saved jobs`);
	}
}

async function clearData(options: ClearDataOptions): Promise<void> {
	try {
		await dbConnect();
		logger.info('📦 Connected to database');

		if (options.all) {
			await clearScrapeHistory();
			await clearSavedJobs();
		} else {
			if (options.scrapeHistory) {
				await clearScrapeHistory();
			}

			if (options.savedJobs) {
				await clearSavedJobs(options.userEmail);
			}
		}

		logger.success('🎉 Data clearing completed successfully!');
	} catch (error) {
		logger.error('❌ Error clearing data:', error);
		process.exit(1);
	}
}

// Parse command line arguments
function parseArgs(): ClearDataOptions {
	const args = process.argv.slice(2);

	const options: ClearDataOptions = {
		scrapeHistory: false,
		savedJobs: false,
		all: false,
	};

	for (let i = 0; i < args.length; i++) {
		switch (args[i]) {
			case '--scrape-history':
				options.scrapeHistory = true;
				break;
			case '--saved-jobs':
				options.savedJobs = true;
				break;
			case '--user':
				if (i + 1 < args.length) {
					options.userEmail = args[i + 1];
					i++; // Skip next argument
				}
				break;
			case '--all':
				options.all = true;
				break;
			case '--help':
			case '-h':
				console.log(`
Usage: npx tsx src/scripts/clearData.ts [options]

Options:
  --scrape-history    Clear all company scrape history
  --saved-jobs        Clear saved jobs (use with --user or --all)
  --user <email>      Clear saved jobs for specific user
  --all               Clear everything (scrape history + all saved jobs)
  --help, -h          Show this help message

Examples:
  # Clear scrape history only
  npx tsx src/scripts/clearData.ts --scrape-history
  
  # Clear saved jobs for specific user
  npx tsx src/scripts/clearData.ts --saved-jobs --user judithv.sanchezc@gmail.com
  
  # Clear all saved jobs
  npx tsx src/scripts/clearData.ts --saved-jobs --all
  
  # Clear everything
  npx tsx src/scripts/clearData.ts --all
        `);
				process.exit(0);
		}
	}

	// Validation
	if (!options.scrapeHistory && !options.savedJobs && !options.all) {
		console.error(
			'❌ Error: You must specify at least one option (--scrape-history, --saved-jobs, or --all)',
		);
		console.error('Use --help for usage information');
		process.exit(1);
	}

	if (options.savedJobs && !options.userEmail && !options.all) {
		console.error(
			'❌ Error: When using --saved-jobs, you must specify either --user <email> or --all',
		);
		process.exit(1);
	}

	return options;
}

// Main execution
if (require.main === module) {
	const options = parseArgs();

	logger.info('🚀 Starting data clearing script...');
	logger.info('Options:', options);

	clearData(options)
		.then(() => {
			process.exit(0);
		})
		.catch(error => {
			logger.error('Script failed:', error);
			process.exit(1);
		});
}

export {clearData, clearScrapeHistory, clearSavedJobs};
