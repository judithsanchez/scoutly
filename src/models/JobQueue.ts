import mongoose, {Schema, Document} from 'mongoose';

export enum JobStatus {
	PENDING = 'pending',
	PROCESSING = 'processing',
	COMPLETED = 'completed',
	FAILED = 'failed',
}

export interface IJobQueue extends Document {
	companyId: mongoose.Schema.Types.ObjectId;
	status: JobStatus;
	lastAttemptAt: Date | null;
	retryCount: number;
}

const JobQueueSchema = new Schema<IJobQueue>(
	{
		companyId: {
			type: Schema.Types.ObjectId,
			ref: 'Company',
			required: true,
		},
		status: {
			type: String,
			enum: Object.values(JobStatus),
			default: JobStatus.PENDING,
			required: true,
		},
		lastAttemptAt: {
			type: Date,
			default: null,
		},
		retryCount: {
			type: Number,
			default: 0,
		},
	},
	{timestamps: true},
);

// Create indexes for efficient queue processing
JobQueueSchema.index({status: 1, createdAt: 1});
JobQueueSchema.index({companyId: 1, status: 1});

export const JobQueue =
	mongoose.models.JobQueue ||
	mongoose.model<IJobQueue>('JobQueue', JobQueueSchema);
