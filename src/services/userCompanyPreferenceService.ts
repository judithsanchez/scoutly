import {UserCompanyPreference} from '@/models/UserCompanyPreference';
import {Company} from '@/models/Company';
import {User} from '@/models/User';

export class UserCompanyPreferenceService {
	/**
	 * Find all tracked company preferences for a given user
	 * @param userId - The user ID to find preferences for
	 * @returns Array of user company preferences with populated company data
	 */
	static async findByUserId(userId: string) {
		return UserCompanyPreference.find({userId, isTracking: true}).populate(
			'companyId',
		);
	}

	/**
	 * Create or update a user company preference
	 * @param userId - The user ID
	 * @param companyId - The company ID (companyID field, not MongoDB _id)
	 * @param data - The preference data to set (rank, isTracking, etc.)
	 * @returns The created or updated preference
	 */
	static async upsert(
		userId: string,
		companyId: string,
		data: {rank?: number; isTracking?: boolean},
	) {
		const user = await User.findById(userId);
		const company = await Company.findOne({companyID: companyId});

		if (!user || !company) {
			throw new Error('User or Company not found for preference update.');
		}

		const preference = await UserCompanyPreference.findOneAndUpdate(
			{userId: user._id, companyId: company._id},
			{$set: {...data, userId: user._id, companyId: company._id}},
			{upsert: true, new: true, setDefaultsOnInsert: true},
		);

		return preference;
	}
}
