#!/usr/bin/env tsx

/**
 * Quick Job Creation Test
 */

console.log('🛠️ Creating test jobs manually...');

import mongoose from 'mongoose';
import {Company} from '../models/Company';
import {UserCompanyPreference} from '../models/UserCompanyPreference';
import {JobQueue, JobStatus} from '../models/JobQueue';

const MONGODB_URI =
	process.env.MONGODB_URI || 'mongodb://mongodb:27017/scoutly';

async function createTestJobs() {
	try {
		console.log('Connecting...');
		await mongoose.connect(MONGODB_URI, {
			serverSelectionTimeoutMS: 5000,
			connectTimeoutMS: 5000,
		});

		// Get top 3 companies with preferences
		const preferences = await UserCompanyPreference.find({
			isTracking: true,
		})
			.sort({rank: -1})
			.limit(3);

		console.log(`Found ${preferences.length} preferences`);

		let created = 0;
		for (const pref of preferences) {
			// Create job directly
			const job = new JobQueue({
				companyId: pref.companyId,
				status: JobStatus.PENDING,
			});

			await job.save();
			created++;
			console.log(`Created job ${created} for company ${pref.companyId}`);
		}

		console.log(`✅ Created ${created} test jobs`);

		await mongoose.disconnect();
		console.log('🔒 Disconnected');
	} catch (error: any) {
		console.error('❌ Error:', error.message);
		process.exit(1);
	}
}

createTestJobs();
