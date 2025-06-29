import mongoose from 'mongoose';
import {Logger} from '@/utils/logger';

const logger = new Logger('Database');

const MONGODB_URI =
	process.env.MONGODB_URI || 'mongodb://mongodb:27017/scoutly';

export const connectDB = async () => {
	try {
		const options = {
			serverSelectionTimeoutMS: 30000,
			connectTimeoutMS: 15000,
			socketTimeoutMS: 30000,
			maxPoolSize: 10,
			bufferCommands: true,
			maxConnecting: 5,
		};

		await mongoose.connect(MONGODB_URI, options);

		const db = mongoose.connection.db;
		if (!db) {
			throw new Error('Database connection not established');
		}
		await db.admin().ping();
		logger.info('MongoDB connected and ready');
	} catch (error) {
		logger.error('MongoDB connection error:', error);
		throw error;
	}
};

export const disconnectDB = async () => {
	try {
		await mongoose.disconnect();
		logger.info('MongoDB disconnected successfully');
	} catch (error) {
		logger.error('MongoDB disconnection error:', error);
	}
};
