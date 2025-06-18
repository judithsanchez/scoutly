#!/usr/bin/env tsx

/**
 * Debug Enqueue Script - Test enqueue logic step by step
 */

console.log('🔍 Starting debug enqueue process...');

import mongoose from 'mongoose';
import {Company} from '../models/Company';
import {UserCompanyPreference} from '../models/UserCompanyPreference';
import {JobQueue, JobStatus} from '../models/JobQueue';
import {isCompanyDueForScraping} from '../utils/scrapeScheduling';

const MONGODB_URI =
	process.env.MONGODB_URI || 'mongodb://mongodb:27017/scoutly';

async function debugEnqueue() {
	try {
		console.log('Connecting to database...');
		await mongoose.connect(MONGODB_URI, {
			serverSelectionTimeoutMS: 5000,
			connectTimeoutMS: 5000,
		});
		console.log('✅ Connected');

		// Get user preferences
		console.log('Getting user preferences...');
		const userPreferences = await UserCompanyPreference.find({
			isTracking: true,
		}).populate('companyId');

		console.log(`Found ${userPreferences.length} preferences`);

		if (userPreferences.length === 0) {
			console.log('No preferences found, exiting');
			return;
		}

		// Test first few preferences
		const testCount = Math.min(3, userPreferences.length);
		console.log(`Testing first ${testCount} preferences...`);

		for (let i = 0; i < testCount; i++) {
			const pref = userPreferences[i];
			const company = pref.companyId as any;

			console.log(`\nTesting preference ${i + 1}:`);
			console.log(`  Company: ${company?.company || 'NO COMPANY'}`);
			console.log(`  Company ID: ${company?._id || 'NO ID'}`);
			console.log(`  Rank: ${pref.rank}`);
			console.log(
				`  Last Scraped: ${company?.lastSuccessfulScrape || 'Never'}`,
			);

			if (!company) {
				console.log('  ❌ No company found for this preference');
				continue;
			}

			const isDue = isCompanyDueForScraping(
				pref.rank,
				company.lastSuccessfulScrape,
			);
			console.log(`  Due for scraping: ${isDue}`);

			if (isDue) {
				// Check for existing job
				const existingJob = await JobQueue.findOne({
					companyId: company._id,
					status: {$in: [JobStatus.PENDING, JobStatus.PROCESSING]},
				});

				console.log(`  Existing job: ${existingJob ? 'YES' : 'NO'}`);

				if (!existingJob) {
					console.log('  ✅ Would enqueue this company');
				}
			}
		}

		await mongoose.disconnect();
		console.log('\n🔒 Disconnected');
	} catch (error: any) {
		console.error('❌ Error:', error.message);
		process.exit(1);
	}
}

debugEnqueue();
