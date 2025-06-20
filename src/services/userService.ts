import {User, IUser} from '../models/User';
import {EnhancedLogger} from '../utils/enhancedLogger';

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
	 * Add a company to user's tracked companies
	 */
	static async addTrackedCompany(
		email: string,
		companyID: string,
		ranking: number = 75,
	): Promise<IUser> {
		try {
			const user = await User.findOne({email});
			if (!user) {
				throw new Error('User not found');
			}

			// Check if company is already tracked
			const existingIndex = user.trackedCompanies.findIndex(
				(tc: any) => tc.companyID === companyID,
			);

			if (existingIndex >= 0) {
				// Update existing
				user.trackedCompanies[existingIndex].ranking = ranking;
			} else {
				// Add new
				user.trackedCompanies.push({companyID, ranking});
			}

			await user.save();
			logger.info(`Added/updated tracked company ${companyID} for user ${email}`);
			return user;
		} catch (error: any) {
			logger.error(`Error adding tracked company:`, error);
			throw new Error(`Error adding tracked company: ${error.message}`);
		}
	}

	/**
	 * Remove a company from user's tracked companies
	 */
	static async removeTrackedCompany(
		email: string,
		companyID: string,
	): Promise<IUser> {
		try {
			const user = await User.findOne({email});
			if (!user) {
				throw new Error('User not found');
			}

			user.trackedCompanies = user.trackedCompanies.filter(
				(tc: any) => tc.companyID !== companyID,
			);

			await user.save();
			logger.info(`Removed tracked company ${companyID} for user ${email}`);
			return user;
		} catch (error: any) {
			logger.error(`Error removing tracked company:`, error);
			throw new Error(`Error removing tracked company: ${error.message}`);
		}
	}

	/**
	 * Update ranking for a tracked company
	 */
	static async updateTrackedCompanyRanking(
		email: string,
		companyID: string,
		ranking: number,
	): Promise<IUser> {
		try {
			const user = await User.findOne({email});
			if (!user) {
				throw new Error('User not found');
			}

			const trackedCompany = user.trackedCompanies.find(
				(tc: any) => tc.companyID === companyID,
			);

			if (!trackedCompany) {
				throw new Error('Company not found in tracked companies');
			}

			trackedCompany.ranking = ranking;
			await user.save();
			logger.info(`Updated ranking for company ${companyID} to ${ranking} for user ${email}`);
			return user;
		} catch (error: any) {
			logger.error(`Error updating tracked company ranking:`, error);
			throw new Error(`Error updating tracked company ranking: ${error.message}`);
		}
	}
}
