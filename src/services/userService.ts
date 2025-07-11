import {connectDB} from '@/config/database';
import {User} from '@/models/User';

export class UserService {
	static async createUser(data: Record<string, any>) {
		await connectDB();
		const user = new User(data);
		await user.save();
		return user;
	}

	static async getAllUsers() {
		await connectDB();
		return User.find({});
	}

	static async getUserByEmail(email: string) {
		await connectDB();
		return User.findOne({email});
	}

	static async promoteUser(data: {email: string}, secret?: string) {
		await connectDB();
		if (!data?.email) {
			throw new Error('Email is required');
		}
		// Optionally check secret if needed
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
}
