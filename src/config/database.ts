import mongoose from 'mongoose';
import {Logger} from '@/utils/logger';

const logger = new Logger('Database');

const MONGODB_URI =
	process.env.MONGODB_URI || 'mongodb://mongodb:27017/scoutly';

export const connectDB = async () => {
	try {
		await mongoose.connect(MONGODB_URI);
		logger.info('MongoDB connected successfully');
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
