import mongoose, {Schema, Document} from 'mongoose';

export interface IUserCompanyPreference extends Document {
	userId: string;
	companyId: mongoose.Schema.Types.ObjectId;
	rank: number; // 1-100, with 100 being highest priority
	isTracking: boolean;
	frequency?: string; // e.g. "Weekly", "Monthly", etc.
	_id: mongoose.Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const UserCompanyPreferenceSchema = new Schema<IUserCompanyPreference>(
	{
		userId: {
			type: String,
			required: true,
		},
		companyId: {
			type: Schema.Types.ObjectId,
			ref: 'Company',
			required: true,
		},
		rank: {
			type: Number,
			required: true,
			min: 1,
			max: 100,
			default: 50,
		},
		isTracking: {
			type: Boolean,
			required: true,
			default: true,
		},
		frequency: {
			type: String,
			required: false,
			enum: ['Daily', 'Every 2 days', 'Weekly', 'Bi-weekly', 'Monthly'],
		},
	},
	{timestamps: true},
);

// Create a compound index to ensure uniqueness and optimize queries
UserCompanyPreferenceSchema.index({userId: 1, companyId: 1}, {unique: true});
UserCompanyPreferenceSchema.index({userId: 1, isTracking: 1, rank: -1});

export const UserCompanyPreference =
	mongoose.models.UserCompanyPreference ||
	mongoose.model<IUserCompanyPreference>(
		'UserCompanyPreference',
		UserCompanyPreferenceSchema,
	);
