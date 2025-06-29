// src/lib/db.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
	throw new Error('Please define the MONGODB_URI environment variable');
}

// This global caching is essential in a serverless environment
let cached = (global as any).mongoose;
if (!cached) {
	cached = (global as any).mongoose = {conn: null, promise: null};
}

async function connectToDB() {
	// If we have a cached connection, use it
	if (cached.conn) {
		return cached.conn;
	}

	// If there's no connection promise, create one
	if (!cached.promise) {
		const opts = {
			serverSelectionTimeoutMS: 30000, // 30-second timeout
			family: 4, // Force IPv4 to avoid potential issues
		};

		cached.promise = mongoose.connect(MONGODB_URI, opts).then(mongoose => {
			console.log('New database connection established');
			return mongoose;
		});
	}

	// Wait for the connection promise to resolve
	cached.conn = await cached.promise;
	return cached.conn;
}

export default connectToDB;
