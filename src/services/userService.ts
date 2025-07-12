import {connectDB} from '@/config/database';
import {User} from '@/models/User';
import {UserCredential} from '@/models/UserCredential';

export class UserService {
	static async createUser(data: Record<string, any>) {
		await connectDB();
		const user = new User(data);
		await user.save();
		return user;
	}

	static async getCredentialByEmail(email: string) {
		await connectDB();
		return UserCredential.findOne({email});
	}

	static async createCredential({
		userId,
		email,
		passwordHash,
	}: {
		userId: any;
		email: string;
		passwordHash: string;
	}) {
		await connectDB();
		const cred = new UserCredential({userId, email, passwordHash});
		await cred.save();
		return cred;
	}

	static async updateCredentialPassword(
		email: string,
		newPasswordHash: string,
	) {
		await connectDB();
		const cred = await UserCredential.findOne({email});
		if (!cred) return null;
		cred.passwordHash = newPasswordHash;
		await cred.save();
		return cred;
	}

	static async getCredentialByUserId(userId: string) {
		await connectDB();
		return UserCredential.findOne({userId});
	}

	static async getAllUsers() {
		await connectDB();
		return User.find({});
	}

	static async getUserByEmail(email: string) {
		await connectDB();
		return User.findOne({email});
	}

	static async getUserById(userId: string) {
		await connectDB();
		return User.findOne({userId});
	}

	static async promoteUser(data: {email: string}, secret?: string) {
		await connectDB();
		if (!data?.email) {
			throw new Error('Email is required');
		}
		const user = await User.findOneAndUpdate(
			{email: data.email},
			{$set: {isAdmin: true}},
			{new: true},
		);
		if (!user) {
			throw new Error('User not found');
		}
		return {message: `User ${data.email} promoted to admin`, user};
	}

	static async updateUserProfile(
		email: string,
		update: {cvUrl?: string; candidateInfo?: any},
	) {
		await connectDB();
		const user = await User.findOneAndUpdate(
			{email},
			{$set: update},
			{new: true},
		);
		return user;
	}
}
