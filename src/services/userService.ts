import {User, IUser} from '../models/User';
import {Logger} from '../utils/logger';

const logger = new Logger('UserService');

export class UserService {
	static async getOrCreateUser(
		email: string,
		cvUrl?: string,
		candidateInfo?: IUser['candidateInfo'],
	): Promise<IUser> {
		try {
			let user = await User.findOne({email});

			if (!user) {
				logger.info(`Creating new user with email: ${email}`);
				user = await User.create({email, cvUrl, candidateInfo});
			}

			return user;
		} catch (error: any) {
			throw new Error(`Error in user operation: ${error.message}`);
		}
	}

	static async getUserByEmail(email: string): Promise<IUser | null> {
		try {
			return await User.findOne({email});
		} catch (error: any) {
			throw new Error(`Error finding user: ${error.message}`);
		}
	}

	static async getAllUsers(): Promise<IUser[]> {
		try {
			return await User.find();
		} catch (error: any) {
			throw new Error(`Error fetching users: ${error.message}`);
		}
	}

	static async addTrackedCompany(
		email: string,
		companyId: string,
	): Promise<IUser> {
		try {
			const user = await User.findOneAndUpdate(
				{email},
				{$addToSet: {trackedCompanies: companyId}},
				{new: true, upsert: true},
			);
			if (!user) {
				throw new Error('Failed to update user');
			}
			return user;
		} catch (error: any) {
			throw new Error(`Error adding tracked company: ${error.message}`);
		}
	}

	static async removeTrackedCompany(
		email: string,
		companyId: string,
	): Promise<IUser> {
		try {
			const user = await User.findOneAndUpdate(
				{email},
				{$pull: {trackedCompanies: companyId}},
				{new: true},
			);
			if (!user) {
				throw new Error('User not found');
			}
			return user;
		} catch (error: any) {
			throw new Error(`Error removing tracked company: ${error.message}`);
		}
	}
}
