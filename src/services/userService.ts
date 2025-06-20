import {User, IUser} from '../models/User';
import {EnhancedLogger} from '../utils/enhancedLogger';
import {UserCompanyPreferenceService} from './userCompanyPreferenceService';

const logger = EnhancedLogger.getLogger('UserService', {
	logToFile: true,
	logToConsole: true,
	logDir: '/tmp/scoutly-logs',
	logFileName: 'user-service.log',
});

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
			logger.error(`Error in user operation:`, error);
			throw new Error(`Error in user operation: ${error.message}`);
		}
	}

	static async getUserByEmail(email: string): Promise<IUser | null> {
		try {
			return await User.findOne({email});
		} catch (error: any) {
			logger.error(`Error finding user:`, error);
			throw new Error(`Error finding user: ${error.message}`);
		}
	}

	static async getAllUsers(): Promise<IUser[]> {
		try {
			return await User.find();
		} catch (error: any) {
			logger.error(`Error fetching users:`, error);
			throw new Error(`Error fetching users: ${error.message}`);
		}
	}

	/**
	 * @deprecated Use UserCompanyPreferenceService.setCompanyPreference instead
	 */
	static async addTrackedCompany(
		email: string,
		companyId: string,
		ranking: number = 75,
	): Promise<IUser> {
		try {
			logger.warn(
				`DEPRECATED: addTrackedCompany called for ${email}, companyId: ${companyId}`,
			);

			// First, get or create the user
			let user = await UserService.getOrCreateUser(email);

			// Use UserCompanyPreferenceService to track the company
			await UserCompanyPreferenceService.setCompanyPreference(
				user.id,
				companyId,
				ranking,
				true,
			);

			// Return the updated user (for backwards compatibility)
			const updatedUser = await User.findById(user.id);
			if (!updatedUser) {
				throw new Error('User not found after update');
			}
			return updatedUser;
		} catch (error: any) {
			logger.error(`Error adding tracked company for ${email}:`, error);
			throw new Error(`Error adding tracked company: ${error.message}`);
		}
	}

	/**
	 * @deprecated Use UserCompanyPreferenceService.stopTrackingCompany instead
	 */
	static async removeTrackedCompany(
		email: string,
		companyId: string,
	): Promise<IUser> {
		try {
			logger.warn(
				`DEPRECATED: removeTrackedCompany called for ${email}, companyId: ${companyId}`,
			);

			// Get the user
			const user = await User.findOne({email});
			if (!user) {
				throw new Error('User not found');
			}

			// Use UserCompanyPreferenceService to stop tracking
			await UserCompanyPreferenceService.stopTrackingCompany(
				user.id,
				companyId,
			);

			// Return the updated user (for backwards compatibility)
			const updatedUser = await User.findById(user.id);
			if (!updatedUser) {
				throw new Error('User not found after update');
			}
			return updatedUser;
		} catch (error: any) {
			logger.error(`Error removing tracked company:`, error);
			throw new Error(`Error removing tracked company: ${error.message}`);
		}
	}

	/**
	 * @deprecated Use UserCompanyPreferenceService.updateCompanyPreference instead
	 */
	static async updateTrackedCompanyRanking(
		email: string,
		companyId: string,
		ranking: number,
	): Promise<IUser> {
		try {
			logger.warn(
				`DEPRECATED: updateTrackedCompanyRanking called for ${email}, companyId: ${companyId}`,
			);

			// Get the user
			const user = await User.findOne({email});
			if (!user) {
				throw new Error('User not found');
			}

			// Use UserCompanyPreferenceService to update the ranking
			await UserCompanyPreferenceService.updateCompanyPreference(
				user.id,
				companyId,
				{rank: ranking},
			);

			// Return the updated user (for backwards compatibility)
			const updatedUser = await User.findById(user.id);
			if (!updatedUser) {
				throw new Error('User not found after update');
			}
			return updatedUser;
		} catch (error: any) {
			logger.error(`Error updating tracked company ranking:`, error);
			throw new Error(
				`Error updating tracked company ranking: ${error.message}`,
			);
		}
	}
}
