import {
	UserCompanyPreference,
	IUserCompanyPreference,
} from '../models/UserCompanyPreference';
import {Company, ICompany} from '../models/Company';
import {EnhancedLogger} from '../utils/enhancedLogger';
import {getScrapeFrequencyDescription} from '../utils/scrapeScheduling';
import mongoose from 'mongoose';

const logger = EnhancedLogger.getLogger('UserCompanyPreferenceService', {
	logToFile: true,
	logToConsole: true,
	logDir: '/tmp/scoutly-logs',
	logFileName: 'user-company-preference-service.log',
});

export interface TrackedCompany extends ICompany {
	userPreference: {
		rank: number;
		isTracking: boolean;
		frequency: string;
		lastUpdated: Date;
	};
}

export class UserCompanyPreferenceService {
	/**
	 * Helper method to build a query that works with both ObjectId and companyID
	 */
	private static buildCompanyQuery(companyIdOrObjectId: string) {
		// Check if the value is a valid ObjectId
		if (mongoose.Types.ObjectId.isValid(companyIdOrObjectId)) {
			// If it's a valid ObjectId, search by both _id and companyID
			return {
				$or: [{_id: companyIdOrObjectId}, {companyID: companyIdOrObjectId}],
			};
		} else {
			// If it's not a valid ObjectId, only search by companyID
			return {companyID: companyIdOrObjectId};
		}
	}

	/**
	 * Add or update a company tracking preference for a user
	 */
	static async setCompanyPreference(
		userId: string,
		companyIdOrObjectId: string,
		rank: number,
		isTracking: boolean = true,
	): Promise<IUserCompanyPreference> {
		try {
			// Validate rank
			if (rank < 1 || rank > 100) {
				throw new Error('Rank must be between 1 and 100');
			}

			// Find company by either _id or companyID field
			const company = await Company.findOne(
				this.buildCompanyQuery(companyIdOrObjectId),
			);
			if (!company) {
				throw new Error('Company not found');
			}

			// Use the MongoDB _id for the preference
			const companyObjectId = company._id;

			// Use upsert to create or update preference
			const preference = await UserCompanyPreference.findOneAndUpdate(
				{userId, companyId: companyObjectId},
				{
					$set: {
						rank,
						isTracking,
					},
				},
				{
					upsert: true,
					new: true,
				},
			);

			logger.info(
				`Updated preference for user ${userId}, company ${company.company}: rank=${rank}, tracking=${isTracking}`,
			);
			return preference;
		} catch (error: any) {
			logger.error('Error setting company preference:', error);
			throw new Error(`Failed to set company preference: ${error.message}`);
		}
	}

	/**
	 * Get all tracked companies for a user with their preferences
	 */
	static async getTrackedCompanies(userId: string): Promise<TrackedCompany[]> {
		try {
			const preferences = await UserCompanyPreference.find({
				userId,
				isTracking: true,
			})
				.populate('companyId')
				.sort({rank: -1}); // Sort by rank descending (highest priority first)

			const trackedCompanies: TrackedCompany[] = preferences.map(pref => {
				const company = pref.companyId as unknown as ICompany;
				return {
					...company.toObject(),
					userPreference: {
						rank: pref.rank,
						isTracking: pref.isTracking,
						frequency: getScrapeFrequencyDescription(pref.rank),
						lastUpdated: pref.updatedAt,
					},
				};
			});

			logger.debug(
				`Retrieved ${trackedCompanies.length} tracked companies for user ${userId}`,
			);
			return trackedCompanies;
		} catch (error: any) {
			logger.error('Error getting tracked companies:', error);
			throw new Error(`Failed to get tracked companies: ${error.message}`);
		}
	}

	/**
	 * Get all companies with their tracking status for a user
	 */
	static async getAllCompaniesWithPreferences(userId: string): Promise<
		Array<
			ICompany & {
				userPreference?: {rank: number; isTracking: boolean; frequency: string};
			}
		>
	> {
		try {
			// Get all companies
			const allCompanies = await Company.find().sort({company: 1});

			// Get user preferences
			const preferences = await UserCompanyPreference.find({userId});
			const preferencesMap = new Map(
				preferences.map(pref => [pref.companyId.toString(), pref]),
			);

			// Combine companies with preferences
			const companiesWithPreferences = allCompanies.map(company => {
				const preference = preferencesMap.get(company._id.toString());

				if (preference) {
					return {
						...company.toObject(),
						userPreference: {
							rank: preference.rank,
							isTracking: preference.isTracking,
							frequency: getScrapeFrequencyDescription(preference.rank),
						},
					};
				}

				// Return company without preference data
				return company.toObject();
			});

			logger.debug(
				`Retrieved ${companiesWithPreferences.length} companies with preferences for user ${userId}`,
			);
			return companiesWithPreferences;
		} catch (error: any) {
			logger.error('Error getting companies with preferences:', error);
			throw new Error(
				`Failed to get companies with preferences: ${error.message}`,
			);
		}
	}

	/**
	 * Remove a company from tracking for a user
	 */
	static async removeCompanyTracking(
		userId: string,
		companyId: string,
	): Promise<boolean> {
		try {
			const result = await UserCompanyPreference.findOneAndUpdate(
				{userId, companyId},
				{$set: {isTracking: false}},
				{new: true},
			);

			if (result) {
				logger.info(
					`Removed tracking for user ${userId}, company ${companyId}`,
				);
				return true;
			}

			return false;
		} catch (error: any) {
			logger.error('Error removing company tracking:', error);
			throw new Error(`Failed to remove company tracking: ${error.message}`);
		}
	}

	/**
	 * Update only the rank for a company preference
	 */
	static async updateCompanyRank(
		userId: string,
		companyId: string,
		rank: number,
	): Promise<IUserCompanyPreference | null> {
		try {
			// Validate rank
			if (rank < 1 || rank > 100) {
				throw new Error('Rank must be between 1 and 100');
			}

			const preference = await UserCompanyPreference.findOneAndUpdate(
				{userId, companyId},
				{$set: {rank}},
				{new: true},
			);

			if (preference) {
				logger.info(
					`Updated rank for user ${userId}, company ${companyId}: ${rank}`,
				);
			}

			return preference;
		} catch (error: any) {
			logger.error('Error updating company rank:', error);
			throw new Error(`Failed to update company rank: ${error.message}`);
		}
	}

	/**
	 * Get summary statistics for a user's tracking preferences
	 */
	static async getTrackingStats(userId: string): Promise<{
		totalTracked: number;
		byFrequency: Record<string, number>;
		averageRank: number;
	}> {
		try {
			const preferences = await UserCompanyPreference.find({
				userId,
				isTracking: true,
			});

			const totalTracked = preferences.length;
			const ranks = preferences.map(p => p.rank);
			const averageRank =
				ranks.length > 0
					? Math.round(ranks.reduce((a, b) => a + b, 0) / ranks.length)
					: 0;

			// Group by frequency
			const byFrequency: Record<string, number> = {};
			preferences.forEach(pref => {
				const frequency = getScrapeFrequencyDescription(pref.rank);
				byFrequency[frequency] = (byFrequency[frequency] || 0) + 1;
			});

			return {
				totalTracked,
				byFrequency,
				averageRank,
			};
		} catch (error: any) {
			logger.error('Error getting tracking stats:', error);
			throw new Error(`Failed to get tracking stats: ${error.message}`);
		}
	}

	/**
	 * Get a specific company preference for a user
	 */
	static async getCompanyPreference(
		userId: string,
		companyId: string,
	): Promise<IUserCompanyPreference | null> {
		try {
			const preference = await UserCompanyPreference.findOne({
				userId,
				companyId,
			}).exec();
			return preference;
		} catch (error: any) {
			logger.error(
				`Error getting company preference for user ${userId}, company ${companyId}:`,
				error,
			);
			throw new Error(`Failed to get company preference: ${error.message}`);
		}
	}

	/**
	 * Update company preference with partial data
	 */
	static async updateCompanyPreference(
		userId: string,
		companyIdOrObjectId: string,
		updates: {rank?: number; isTracking?: boolean},
	): Promise<IUserCompanyPreference | null> {
		try {
			// Validate rank if provided
			if (updates.rank && (updates.rank < 1 || updates.rank > 100)) {
				throw new Error('Rank must be between 1 and 100');
			}

			// Find company by either _id or companyID field
			const company = await Company.findOne(
				this.buildCompanyQuery(companyIdOrObjectId),
			);
			if (!company) {
				throw new Error('Company not found');
			}

			// Use the MongoDB _id for the preference lookup
			const companyObjectId = company._id;

			// Verify preference exists
			const preference = await UserCompanyPreference.findOne({
				userId,
				companyId: companyObjectId,
			});
			if (!preference) {
				return null;
			}

			// Apply updates
			if (updates.rank !== undefined) {
				preference.rank = updates.rank;
			}
			if (updates.isTracking !== undefined) {
				preference.isTracking = updates.isTracking;
			}

			await preference.save();
			return preference;
		} catch (error: any) {
			logger.error(
				`Error updating company preference for user ${userId}, company ${companyIdOrObjectId}:`,
				error,
			);
			throw new Error(`Failed to update company preference: ${error.message}`);
		}
	}

	/**
	 * Stop tracking a company (set isTracking to false)
	 */
	static async stopTrackingCompany(
		userId: string,
		companyIdOrObjectId: string,
	): Promise<{success: boolean}> {
		try {
			// Find company by either _id or companyID field
			const company = await Company.findOne(
				this.buildCompanyQuery(companyIdOrObjectId),
			);
			if (!company) {
				throw new Error('Company not found');
			}

			// Use the MongoDB _id for the preference operation
			const companyObjectId = company._id;

			const result = await UserCompanyPreference.updateOne(
				{userId, companyId: companyObjectId},
				{$set: {isTracking: false}},
			);

			return {success: result.modifiedCount > 0};
		} catch (error: any) {
			logger.error(
				`Error stopping tracking for user ${userId}, company ${companyIdOrObjectId}:`,
				error,
			);
			throw new Error(`Failed to stop tracking company: ${error.message}`);
		}
	}
}
