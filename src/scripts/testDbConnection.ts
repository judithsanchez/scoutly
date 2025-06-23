/**
 * Simple database connection test
 */

import {connectToDatabase} from '@/lib/mongodb';
import mongoose from 'mongoose';

async function testConnection() {
	try {
		console.log('Testing database connection...');
		console.log('MongoDB URI:', process.env.MONGODB_URI);

		await connectToDatabase();
		console.log('✅ Database connection successful!');
		console.log('Connection state:', mongoose.connection.readyState);

		// Test a simple query
		const collections = await mongoose.connection.db
			.listCollections()
			.toArray();
		console.log(
			'Available collections:',
			collections.map(c => c.name),
		);
	} catch (error) {
		console.error('❌ Database connection failed:', error);
	} finally {
		await mongoose.connection.close();
		process.exit(0);
	}
}

testConnection();
