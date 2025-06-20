#!/usr/bin/env npx tsx

/**
 * Database inspection script to debug TokenUsage collection issues
 */
import dbConnect from '@/middleware/database';
import mongoose from 'mongoose';

async function inspectDatabase() {
	console.log('🔍 Inspecting database...');

	try {
		// Connect to database
		console.log('📦 Connecting to database...');
		await dbConnect();
		console.log('✅ Database connected successfully');

		// Check if database exists
		const db = mongoose.connection.db;
		if (!db) {
			throw new Error('Database connection not established');
		}

		console.log('📊 Database info:', {
			dbName: db.databaseName,
			readyState: mongoose.connection.readyState,
		});

		// List all collections
		console.log('📋 Listing collections...');
		const collections = await db.listCollections().toArray();
		console.log(
			'Collections found:',
			collections.map(c => c.name),
		);

		// Check if tokenusages collection exists
		const hasTokenUsageCollection = collections.some(
			c => c.name === 'tokenusages',
		);
		console.log('TokenUsage collection exists:', hasTokenUsageCollection);

		if (hasTokenUsageCollection) {
			// Get collection stats
			const tokenUsageCollection = db.collection('tokenusages');
			const count = await tokenUsageCollection.countDocuments();
			console.log('TokenUsage documents count:', count);

			// Check indexes
			const indexes = await tokenUsageCollection.indexes();
			console.log(
				'TokenUsage indexes:',
				indexes.map(i => ({name: i.name, key: i.key})),
			);
		}

		// Test simple insert
		console.log('🧪 Testing simple insert...');
		const testCollection = db.collection('test_insert');
		const insertResult = await testCollection.insertOne({
			test: true,
			timestamp: new Date(),
		});
		console.log('✅ Simple insert successful:', insertResult.insertedId);

		// Clean up test
		await testCollection.deleteOne({_id: insertResult.insertedId});
		console.log('🧹 Test document cleaned up');
	} catch (error) {
		console.error('❌ Database inspection failed:', error);
	} finally {
		await mongoose.connection.close();
		console.log('🔌 Database connection closed');
		process.exit(0);
	}
}

inspectDatabase();
