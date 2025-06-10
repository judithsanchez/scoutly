import mongoose, {Schema, Document} from 'mongoose';

/**
 * Defines the possible statuses for a saved job application.
 */
export enum ApplicationStatus {
	WANT_TO_APPLY = 'WANT_TO_APPLY', // Star/favorite status
	PENDING_APPLICATION = 'PENDING_APPLICATION', // Marked as "I will apply"
	APPLIED = 'APPLIED', // Application has been sent
	DISCARDED = 'DISCARDED', // User is not interested
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

	// --- Relationships ---
	user: mongoose.Schema.Types.ObjectId; // Reference to the User who saved this job
	company: mongoose.Schema.Types.ObjectId; // Reference to the Company offering the job
}

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

// Check if model exists before compiling
export const SavedJob =
	mongoose.models.SavedJob ||
	mongoose.model<ISavedJob>('SavedJob', SavedJobSchema);
