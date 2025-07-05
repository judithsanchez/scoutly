import mongoose, {Schema, Document} from 'mongoose';

// Sub-schemas for CandidateInfo
const CurrentResidenceSchema = new Schema(
	{
		city: String,
		country: String,
		countryCode: String,
		timezone: String,
	},
	{_id: false},
);

const WorkAuthorizationSchema = new Schema(
	{
		region: String,
		regionCode: String,
		status: String,
	},
	{_id: false},
);

const LogisticsSchema = new Schema(
	{
		currentResidence: CurrentResidenceSchema,
		willingToRelocate: Boolean,
		workAuthorization: [WorkAuthorizationSchema],
	},
	{_id: false},
);

const LanguageSchema = new Schema(
	{
		language: String,
		level: String,
	},
	{_id: false},
);

const ExclusionsSchema = new Schema(
	{
		industries: [String],
		technologies: [String],
		roleTypes: [String],
	},
	{_id: false},
);

const PreferencesSchema = new Schema(
	{
		careerGoals: [String],
		jobTypes: [String],
		workEnvironments: [String],
		companySizes: [String],
		exclusions: ExclusionsSchema,
	},
	{_id: false},
);

const CandidateInfoSchema = new Schema(
	{
		logistics: LogisticsSchema,
		languages: [LanguageSchema],
		preferences: PreferencesSchema,
	},
	{_id: false},
);

export interface IUser extends Document {
	email: string;
	cvUrl?: string;
	candidateInfo?: typeof CandidateInfoSchema;
	createdAt: Date;
	updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
	{
		email: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
			index: false,
		},
		cvUrl: {
			type: String,
			trim: true,
		},
		candidateInfo: CandidateInfoSchema,
	},
	{
		timestamps: true,
		autoIndex: false,
	},
);

// Check if the model exists before compiling it
export const User =
	mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
