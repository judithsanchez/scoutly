#!/usr/bin/env tsx

/**
 * Simple database connection test
 */

import {connectDB, disconnectDB} from '../config/database';
import {Company} from '../models/Company';

async function testConnection() {
	try {
		console.log('🔗 Testing database connection...');
		await connectDB();
		console.log('✅ Database connected successfully');

		const companyCount = await Company.countDocuments();
		console.log(`📊 Found ${companyCount} companies in database`);

		await disconnectDB();
		console.log('🔒 Database disconnected');
	} catch (error: any) {
		console.error('❌ Database connection failed:', error.message);
		process.exit(1);
	}
}

if (require.main === module) {
	testConnection()
		.then(() => {
			console.log('🏁 Test completed successfully');
			process.exit(0);
		})
		.catch(error => {
			console.error('💥 Test failed:', error);
			process.exit(1);
		});
}
