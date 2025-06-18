#!/usr/bin/env tsx

/**
 * Standalone test script to verify background jobs functionality
 */

console.log('🔗 Starting standalone background jobs test...');

import mongoose from 'mongoose';
import {Company} from '../models/Company';
import {UserCompanyPreference} from '../models/UserCompanyPreference';
import {JobQueue, JobStatus} from '../models/JobQueue';

const MONGODB_URI =
	process.env.MONGODB_URI || 'mongodb://mongodb:27017/scoutly';

async function runStandaloneTest() {
	try {
		console.log('Connecting to database...');
		await mongoose.connect(MONGODB_URI, {
			serverSelectionTimeoutMS: 5000,
			connectTimeoutMS: 5000,
		});
		console.log('✅ Connected to database');

		// Count existing data
		const companyCount = await Company.countDocuments();
		const preferenceCount = await UserCompanyPreference.countDocuments();
		const jobCount = await JobQueue.countDocuments();

		console.log(
			`📊 Current data: ${companyCount} companies, ${preferenceCount} preferences, ${jobCount} jobs`,
		);

		// Test creating a user preference
		if (companyCount > 0) {
			const firstCompany = await Company.findOne();
			console.log(`🏢 Testing with company: ${firstCompany?.company}`);

			const testUserId = 'test@example.com';

			// Create a test preference
			const preference = new UserCompanyPreference({
				userId: testUserId,
				companyId: firstCompany?._id,
				rank: 95,
				isTracking: true,
			});

			await preference.save();
			console.log('✅ Created test user preference');

			// Test creating a job
			const job = new JobQueue({
				companyId: firstCompany?._id,
				status: JobStatus.PENDING,
			});

			await job.save();
			console.log('✅ Created test job');

			// Clean up
			await UserCompanyPreference.deleteOne({_id: preference._id});
			await JobQueue.deleteOne({_id: job._id});
			console.log('🧹 Cleaned up test data');
		}

		await mongoose.disconnect();
		console.log('🔒 Disconnected from database');
		console.log('🎉 Test completed successfully!');
	} catch (error: any) {
		console.error('❌ Test failed:', error.message);
		process.exit(1);
	}
}

runStandaloneTest();
