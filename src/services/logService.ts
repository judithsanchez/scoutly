import {Log, type ILog, type LogLevel} from '../models/Log';
import crypto from 'crypto';

interface LogEntry {
	timestamp: Date;
	level: LogLevel;
	message: string;
	context: string;
	data?: Record<string, any>;
	sequence: number;
}

export class LogService {
	public static async saveBatchedLogs(logs: LogEntry[]): Promise<ILog> {
		if (logs.length === 0) {
			throw new Error('Cannot save empty log batch');
		}

		try {
			// Create a single document containing all logs
			const batch = {
				processId: crypto.randomUUID(),
				context: logs[0].context, // Use context from first log
				startTime: logs[0].timestamp,
				endTime: logs[logs.length - 1].timestamp,
				entries: logs.map(entry => ({
					...entry,
					sequence: entry.sequence || 0,
				})),
			};

			const log = await Log.create(batch);
			return log;
		} catch (error: any) {
			console.error('Failed to write batched logs to database:', error.message);
			throw new Error(`Error creating log batch: ${error.message}`);
		}
	}
}
