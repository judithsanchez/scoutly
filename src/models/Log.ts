import mongoose, {Schema, Document} from 'mongoose';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

export interface ILog extends Document {
	timestamp: Date;
	level: LogLevel;
	message: string;
	context: string;
	data?: Record<string, any>;
	sequence?: number;
}

const LogSchema = new Schema<ILog>(
	{
		timestamp: {type: Date, required: true},
		level: {type: String, required: true},
		message: {type: String, required: true},
		context: {type: String, required: true},
		data: {type: Schema.Types.Mixed},
		sequence: {type: Number},
	},
	{
		capped: {size: 52428800, max: 50000},
		timestamps: false,
	},
);

// Check if model exists before compiling
export const Log =
	mongoose.models.Log || mongoose.model<ILog>('Log', LogSchema);
