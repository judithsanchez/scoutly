import mongoose from 'mongoose';
import {Logger} from '@/utils/logger';

const logger = new Logger('Database');

const MONGODB_URI =
	process.env.MONGODB_URI || 'mongodb://mongodb:27017/scoutly';

if (!MONGODB_URI) {
	throw new Error('Please define the MONGODB_URI environment variable');
}

interface GlobalMongo {
	conn: typeof mongoose | null;
	promise: Promise<typeof mongoose> | null;
}

declare global {
	var mongoose: GlobalMongo | undefined;
}

const cached = global.mongoose || {conn: null, promise: null};

if (!global.mongoose) {
	global.mongoose = cached;
}

async function dbConnect() {
	if (cached.conn) {
		logger.info('Using cached database connection');
		return cached.conn;
	}

	if (!cached.promise) {
		const opts = {
			bufferCommands: true,
			serverSelectionTimeoutMS: 30000,
			connectTimeoutMS: 30000,
			socketTimeoutMS: 45000,
			maxPoolSize: 10,
		};

		logger.info('Connecting to MongoDB...');
		cached.promise = mongoose.connect(MONGODB_URI, opts).then(mongoose => {
			logger.success('Connected to MongoDB');
			return mongoose;
		});
	}

	try {
		cached.conn = await cached.promise;
	} catch (e) {
		cached.promise = null;
		logger.error('Failed to connect to MongoDB', e);
		throw e;
	}

	return cached.conn;
}

export default dbConnect;
