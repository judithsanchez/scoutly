#!/usr/bin/env tsx

/**
 * Simple Clean Test Data Script
 */

import mongoose from 'mongoose';

async function cleanTestData() {
	try {
		console.log('🧹 Starting cleanup of test data...');

		// Connect to MongoDB
		await mongoose.connect('mongodb://localhost:27017/scoutly');

		// Delete data from collections
		const jobQueueResult = await mongoose.connection.db
			.collection('jobqueues')
			.deleteMany({});
		console.log(`✓ Deleted ${jobQueueResult.deletedCount} job queue entries`);

		const savedJobsResult = await mongoose.connection.db
			.collection('savedjobs')
			.deleteMany({});
		console.log(`✓ Deleted ${savedJobsResult.deletedCount} saved jobs`);

		const usersResult = await mongoose.connection.db
			.collection('users')
			.deleteMany({});
		console.log(`✓ Deleted ${usersResult.deletedCount} users`);

		const preferencesResult = await mongoose.connection.db
			.collection('usercompanypreferences')
			.deleteMany({});
		console.log(
			`✓ Deleted ${preferencesResult.deletedCount} user company preferences`,
		);

		const tokenUsageResult = await mongoose.connection.db
			.collection('tokenusages')
			.deleteMany({});
		console.log(
			`✓ Deleted ${tokenUsageResult.deletedCount} token usage records`,
		);

		const scrapeHistoryResult = await mongoose.connection.db
			.collection('companyscrapehistories')
			.deleteMany({});
		console.log(
			`✓ Deleted ${scrapeHistoryResult.deletedCount} company scrape histories`,
		);

		const companyCount = await mongoose.connection.db
			.collection('companies')
			.countDocuments();
		console.log(`✓ Kept all ${companyCount} companies in the database`);

		console.log('🎉 Database cleanup complete! Ready for fresh start.');
	} catch (error) {
		console.error('Failed to clean test data:', error);
		process.exit(1);
	} finally {
		await mongoose.disconnect();
	}
}

// Run the cleanup
cleanTestData()
	.then(() => {
		console.log('Script execution complete');
		process.exit(0);
	})
	.catch(error => {
		console.error('Script failed:', error);
		process.exit(1);
	});
