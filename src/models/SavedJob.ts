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
	jobId: string; // Reference to the Job that was saved (using URL as identifier)
	companyId: mongoose.Schema.Types.ObjectId; // Reference to the Company offering the job
	status: string; // Current application status
	
	// Core job information (required by Gemini schema)
	title: string; // Job title
	url: string; // Job URL
	goodFitReasons: string[]; // AI analysis - why it's a good fit
	considerationPoints: string[]; // AI analysis - points to consider
	stretchGoals: string[]; // AI analysis - stretch goals
	suitabilityScore: number; // AI analysis - overall suitability score (0-100)
	
	// Optional job details (optional in Gemini schema)
	location?: string; // Job location
	timezone?: string; // Timezone or working hours
	salary?: {
		min?: number;
		max?: number;
		currency?: string;
		period?: string;
	};
	techStack?: string[]; // Required technologies
	experienceLevel?: string; // Required experience level
	languageRequirements?: string[]; // Required languages
	visaSponsorshipOffered?: boolean; // Visa sponsorship availability
	relocationAssistanceOffered?: boolean; // Relocation assistance availability
	
	notes?: string; // Optional field for user notes
	createdAt: Date;
	updatedAt: Date;
}

// SavedJob schema matching Gemini AI analysis structure
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
			default: 'WANT_TO_APPLY',
			required: true,
		},
		
		// Core job information (required by Gemini schema)
		title: {
			type: String,
			required: true,
		},
		url: {
			type: String,
			required: true,
		},
		goodFitReasons: {
			type: [String],
			required: true,
			default: [],
		},
		considerationPoints: {
			type: [String], 
			required: true,
			default: [],
		},
		stretchGoals: {
			type: [String],
			required: true,
			default: [],
		},
		suitabilityScore: {
			type: Number,
			required: true,
			min: 0,
			max: 100,
		},
		
		// Optional job details (optional in Gemini schema)
		location: {
			type: String,
		},
		timezone: {
			type: String,
		},
		salary: {
			min: Number,
			max: Number,
			currency: String,
			period: String,
		},
		techStack: {
			type: [String],
			default: [],
		},
		experienceLevel: {
			type: String,
		},
		languageRequirements: {
			type: [String],
			default: [],
		},
		visaSponsorshipOffered: {
			type: Boolean,
		},
		relocationAssistanceOffered: {
			type: Boolean,
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
