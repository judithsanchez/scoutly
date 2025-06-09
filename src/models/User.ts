import mongoose, {Schema, Document} from 'mongoose';

export interface IUser extends Document {
	email: string;
	createdAt: Date;
	updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
	},
	{
		timestamps: true, // Automatically adds createdAt and updatedAt fields
	},
);

// Check if the model exists before compiling it
export const User =
	mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
