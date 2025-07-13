import { env } from '@/config';
import mongoose, {Schema, Document, Types} from 'mongoose';

export interface IUserCredential extends Document {
	userId: Types.ObjectId;
	email: string;
	passwordHash: string;
	createdAt: Date;
	updatedAt: Date;
}

const UserCredentialSchema = new Schema<IUserCredential>(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
			unique: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			index: true,
		},
		passwordHash: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: true,
		autoIndex: !env.isProd
	},
);

export const UserCredential =
	mongoose.models.UserCredential ||
	mongoose.model<IUserCredential>('UserCredential', UserCredentialSchema);
