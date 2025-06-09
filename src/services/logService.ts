import {Log, type ILog, type LogLevel} from '../models/Log';

interface LogEntry {
	timestamp: Date;
	level: LogLevel;
	message: string;
	context: string;
	data?: Record<string, any>;
	sequence?: number;
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

	public static async createLogs(logEntries: LogEntry[]): Promise<ILog[]> {
		try {
			const logs = await Log.insertMany(logEntries);
			return logs;
		} catch (error: any) {
			console.error('Failed to write logs to database:', error.message);
			throw new Error(`Error creating logs: ${error.message}`);
		}
	}
}
