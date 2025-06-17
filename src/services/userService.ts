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
		ranking: number = 75,
	): Promise<IUser> {
		try {
			// Debug log for parameter types
			logger.info(
				`Adding tracked company with parameters - email: ${email}, companyId: ${companyId} (${typeof companyId}), ranking: ${ranking} (${typeof ranking})`,
			);

			let user = await User.findOne({email});

			if (!user) {
				// If user doesn't exist, create them with the tracked company
				logger.info(
					`User ${email} not found. Creating new user and tracking company ${companyId}.`,
				);
				user = await User.create({
					email,
					trackedCompanies: [{companyID: companyId, ranking}],
				});
				if (!user) {
					throw new Error('Failed to create new user while tracking company');
				}
				return user;
			}

			// User exists, check if company is already tracked
			const trackedCompanyIndex = user.trackedCompanies.findIndex(
				(tc: {companyID: string; ranking: number}) =>
					tc.companyID === companyId,
			);

			if (trackedCompanyIndex > -1) {
				// Company is already tracked, update its ranking
				logger.info(
					`Company ${companyId} already tracked by ${email}. Updating ranking to ${ranking}.`,
				);
				user.trackedCompanies[trackedCompanyIndex].ranking = ranking;
			} else {
				// Company is not tracked, add it
				logger.info(`Adding company ${companyId} to ${email}'s tracked list.`);
				// Ensure we're using the correct property name (companyID not companyId)
				const companyEntry = {
					companyID: companyId,
					ranking: ranking,
				};

				logger.info(
					`Creating tracked company entry: ${JSON.stringify(companyEntry)}`,
				);
				user.trackedCompanies.push(companyEntry);
			}

			await user.save();
			return user;
		} catch (error: any) {
			logger.error(`Error adding tracked company for ${email}:`, error);
			// Add more debug information
			if (error.name === 'CastError' && error.path === 'companyID') {
				logger.error(
					`Cast error details - value: ${JSON.stringify(error.value)}, kind: ${
						error.kind
					}`,
				);
			}
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
				{$pull: {trackedCompanies: {companyID: companyId}}},
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

	static async updateTrackedCompanyRanking(
		email: string,
		companyId: string,
		ranking: number,
	): Promise<IUser> {
		try {
			const user = await User.findOneAndUpdate(
				{email, 'trackedCompanies.companyID': companyId},
				{$set: {'trackedCompanies.$.ranking': ranking}},
				{new: true},
			);
			if (!user) {
				throw new Error('User or tracked company not found');
			}
			return user;
		} catch (error: any) {
			throw new Error(
				`Error updating tracked company ranking: ${error.message}`,
			);
		}
	}
}
