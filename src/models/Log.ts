import mongoose, {Schema, Document} from 'mongoose';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

interface LogEntry {
	timestamp: Date;
	level: LogLevel;
	message: string;
	context: string;
	data?: Record<string, any>;
	sequence: number;
}

export interface ILog extends Document {
	processId: string; // To group logs from one process/session
	context: string; // Main context (e.g., 'JobMatchingOrchestrator')
	startTime: Date; // When the first log was created
	endTime: Date; // When the logs were saved
	entries: LogEntry[]; // All logs in sequence
}

const LogEntrySchema = new Schema<LogEntry>(
	{
		timestamp: {type: Date, required: true},
		level: {type: String, required: true},
		message: {type: String, required: true},
		context: {type: String, required: true},
		data: {type: Schema.Types.Mixed},
		sequence: {type: Number, required: true},
	},
	{_id: false},
);

const LogSchema = new Schema<ILog>(
	{
		processId: {type: String, required: true},
		context: {type: String, required: true},
		startTime: {type: Date, required: true},
		endTime: {type: Date, required: true},
		entries: [LogEntrySchema],
	},
	{
		capped: {size: 52428800, max: 10000}, // Reduced max since each doc has multiple logs
		timestamps: false,
	},
);

// Index to find logs by process
LogSchema.index({processId: 1});

// Check if model exists before compiling
export const Log =
	mongoose.models.Log || mongoose.model<ILog>('Log', LogSchema);
