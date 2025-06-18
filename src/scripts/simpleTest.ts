#!/usr/bin/env tsx

console.log('🔗 Starting database test...');

import mongoose from 'mongoose';

const MONGODB_URI =
	process.env.MONGODB_URI || 'mongodb://mongodb:27017/scoutly';

async function simpleTest() {
	try {
		console.log('Attempting to connect to:', MONGODB_URI);

		// Set a shorter timeout for testing
		const connectPromise = mongoose.connect(MONGODB_URI, {
			serverSelectionTimeoutMS: 5000,
			connectTimeoutMS: 5000,
		});

		// Add a timeout
		const timeoutPromise = new Promise((_, reject) => {
			setTimeout(() => reject(new Error('Connection timeout')), 10000);
		});

		await Promise.race([connectPromise, timeoutPromise]);
		console.log('✅ Connected successfully');

		await mongoose.disconnect();
		console.log('🔒 Disconnected');
	} catch (error: any) {
		console.error('❌ Connection failed:', error.message);
		process.exit(1);
	}
}

simpleTest();
