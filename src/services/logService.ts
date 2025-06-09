import {Log, type ILog, type LogLevel} from '../models/Log';

interface LogEntry {
	timestamp: Date;
	level: LogLevel;
	message: string;
	context: string;
	data?: Record<string, any>;
}

export class LogService {
	public static async createLog(logEntry: LogEntry): Promise<ILog> {
		try {
			const log = new Log(logEntry);
			return await log.save();
		} catch (error: any) {
			console.error('Failed to write log to database:', error.message);
			throw new Error(`Error creating log: ${error.message}`);
		}
	}
}
