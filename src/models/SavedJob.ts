import mongoose, {Schema, Document} from 'mongoose';

/**
 * Defines the possible statuses for a saved job application.
 */
export enum ApplicationStatus {
	WANT_TO_APPLY = 'WANT_TO_APPLY', // Star/favorite status
	PENDING_APPLICATION = 'PENDING_APPLICATION', // Marked as "I will apply"
	APPLIED = 'APPLIED', // Application has been sent
	INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED', // Interview has been scheduled
	TECHNICAL_ASSESSMENT = 'TECHNICAL_ASSESSMENT', // Technical assessment has been requested
	REJECTED = 'REJECTED', // Company has rejected the application
	OFFER_RECEIVED = 'OFFER_RECEIVED', // Offer has been received
	OFFER_ACCEPTED = 'OFFER_ACCEPTED', // Offer has been accepted
	OFFER_DECLINED = 'OFFER_DECLINED', // Offer has been declined
	STALE = 'STALE', // No response after a defined period
	DISCARDED = 'DISCARDED', // User is not interested
}

export interface ISavedJob extends Document {
	userId: string; // Reference to the User who saved this job
	jobId: string; // Reference to the Job that was saved
	companyId: mongoose.Schema.Types.ObjectId; // Reference to the Company offering the job
	status: string; // Current application status
	notes?: string; // Optional field for user notes
	createdAt: Date;
	updatedAt: Date;
}

// Simplified SavedJob schema for tracking user job preferences
const SavedJobSchema = new Schema<ISavedJob>(
	{
		userId: {
			type: String,
			required: true,
			index: true,
		},
		jobId: {
			type: String,
			required: true,
		},
		companyId: {
			type: Schema.Types.ObjectId,
			ref: 'Company',
			required: true,
		},
		status: {
			type: String,
			default: 'saved',
			required: true,
		},
		notes: {
			type: String,
		},
	},
	{
		timestamps: true,
	},
);

// Create a compound index for user+job to ensure uniqueness
SavedJobSchema.index({userId: 1, jobId: 1}, {unique: true});

// Check if model exists before compiling
export const SavedJob =
	mongoose.models.SavedJob ||
	mongoose.model<ISavedJob>('SavedJob', SavedJobSchema);
