import mongoose, {Document, Schema} from 'mongoose';

export interface IAdminUser extends Document {
	email: string;
	role: 'super_admin' | 'admin' | 'moderator';
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
	isActive: boolean;
	permissions: string[];
}

const AdminUserSchema: Schema = new Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		role: {
			type: String,
			enum: ['super_admin', 'admin', 'moderator'],
			default: 'admin',
			required: true,
		},
		createdBy: {
			type: String,
			required: true,
		},
		isActive: {
			type: Boolean,
			default: true,
			required: true,
		},
		permissions: {
			type: [String],
			default: [],
		},
	},
	{
		timestamps: true,
	},
);

// Indexes for performance (only create if not exists)
AdminUserSchema.index({email: 1}, {unique: true});
AdminUserSchema.index({isActive: 1});
AdminUserSchema.index({role: 1});

export default mongoose.models.AdminUser ||
	mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);
