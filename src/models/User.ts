import mongoose, {Schema, Document} from 'mongoose';

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
	userId: mongoose.Types.ObjectId;
	email: string;
	cvUrl?: string;
	candidateInfo?: typeof CandidateInfoSchema;
	createdAt: Date;
	updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			unique: true,
			index: true,
			default: () => new mongoose.Types.ObjectId(),
		},
		email: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
			unique: true,
			index: true,
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

export const User =
	mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
