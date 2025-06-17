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

// Status history entry to track changes over time
export interface StatusHistoryEntry {
	status: ApplicationStatus;
	date: Date;
	notes?: string;
}

export interface ISavedJob extends Document {
	// --- Core Job Details ---
	title: string;
	url: string;
	location?: string;
	timezone?: string;
	salary?: {
		min?: number;
		max?: number;
		currency?: string;
		period?: string;
	};
	techStack?: string[];
	experienceLevel?: string;
	languageRequirements?: string[];
	visaSponsorshipOffered?: boolean;
	relocationAssistanceOffered?: boolean;

	// --- AI Analysis Results ---
	goodFitReasons: string[];
	considerationPoints: string[];
	stretchGoals: string[];
	suitabilityScore: number;

	// --- User-Specific Tracking ---
	status: ApplicationStatus;
	notes?: string; // Optional field for user notes
	statusHistory: StatusHistoryEntry[]; // Track the history of status changes
	interviewDate?: Date; // For INTERVIEW_SCHEDULED status
	reminderSet?: boolean; // Whether a reminder is set for this job

	// --- Relationships ---
	user: mongoose.Schema.Types.ObjectId; // Reference to the User who saved this job
	company: mongoose.Schema.Types.ObjectId; // Reference to the Company offering the job
}

// Schema for status history entries
const StatusHistorySchema = new Schema(
	{
		status: {
			type: String,
			enum: Object.values(ApplicationStatus),
			required: true,
		},
		date: {
			type: Date,
			default: Date.now,
		},
		notes: String,
	},
	{_id: false},
); // No need for separate IDs for history entries

const SavedJobSchema = new Schema<ISavedJob>(
	{
		title: {type: String, required: true},
		url: {type: String, required: true, unique: true}, // URL should be unique to avoid duplicates per user

		// Job Details
		location: {type: String},
		timezone: {type: String},
		salary: {
			min: {type: Number},
			max: {type: Number},
			currency: {type: String},
			period: {type: String},
		},
		techStack: [{type: String}],
		experienceLevel: {type: String},
		languageRequirements: [{type: String}],
		visaSponsorshipOffered: {type: Boolean},
		relocationAssistanceOffered: {type: Boolean},

		// Analysis Results
		goodFitReasons: [{type: String}],
		considerationPoints: [{type: String}],
		stretchGoals: [{type: String}],
		suitabilityScore: {type: Number, required: true},

		status: {
			type: String,
			enum: Object.values(ApplicationStatus),
			default: ApplicationStatus.PENDING_APPLICATION,
			required: true,
		},
		notes: {type: String},
		statusHistory: [StatusHistorySchema],
		interviewDate: {type: Date},
		reminderSet: {type: Boolean, default: false},

		user: {
			type: Schema.Types.ObjectId,
			ref: 'User', // This will link to a User model
			required: true,
		},
		company: {
			type: Schema.Types.ObjectId,
			ref: 'Company', // This links to your existing Company model
			required: true,
		},
	},
	{
		timestamps: true, // Automatically adds createdAt and updatedAt fields
	},
);

// To prevent a user from saving the exact same job URL twice
SavedJobSchema.index({user: 1, url: 1}, {unique: true});

// Additional compound index for better duplicate detection (URL + title)
SavedJobSchema.index({user: 1, url: 1, title: 1}, {unique: true, sparse: true});

// Pre-save middleware to add status changes to history
SavedJobSchema.pre('save', function (next) {
	const job = this;

	// If this is a new document or the status hasn't been modified, skip
	if (job.isNew || !job.isModified('status')) {
		return next();
	}

	// Add the new status to the history
	if (!job.statusHistory) {
		job.statusHistory = [];
	}

	job.statusHistory.push({
		status: job.status,
		date: new Date(),
		notes: job.notes || undefined,
	});

	// If the status is STALE and it's not explicitly set by user,
	// we don't want to add it to history as it's system-generated
	if (
		job.status === ApplicationStatus.STALE &&
		job.statusHistory.length > 0 &&
		job.statusHistory[job.statusHistory.length - 1].notes ===
			'Automatically marked as stale'
	) {
		job.statusHistory.pop();
	}

	next();
});

// Add interface for model statics
interface SavedJobModel extends mongoose.Model<ISavedJob> {
	checkAndUpdateStaleJobs(daysThreshold?: number): Promise<number>;
}

// Static method to check and update stale jobs
SavedJobSchema.statics.checkAndUpdateStaleJobs = async function (
	daysThreshold = 14,
) {
	const staleDate = new Date();
	staleDate.setDate(staleDate.getDate() - daysThreshold);

	// Find jobs that have been in APPLIED status for too long without updates
	const staleJobs = await this.find({
		status: ApplicationStatus.APPLIED,
		updatedAt: {$lt: staleDate},
	});

	// Update each stale job
	for (const job of staleJobs) {
		job.status = ApplicationStatus.STALE;
		job.notes = 'Automatically marked as stale';
		await job.save();
	}

	return staleJobs.length;
};

// Check if model exists before compiling
export const SavedJob =
	mongoose.models.SavedJob ||
	mongoose.model<ISavedJob, SavedJobModel>('SavedJob', SavedJobSchema);
