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
	 * Find a user-company preference by userId and company business ID
	 */
	static async findByUserAndCompany(userId: string, companyBusinessId: string) {
		const user = await User.findById(userId);
		const company = await Company.findOne({companyID: companyBusinessId});
		if (!user || !company) return null;
		return UserCompanyPreference.findOne({
			userId: user._id,
			companyId: company._id,
		});
	}

	/**
	 * Create a new user-company preference (throws if already exists)
	 */
	static async create(
		userId: string,
		companyBusinessId: string,
		data: {rank?: number; isTracking?: boolean; frequency?: string},
	) {
		const user = await User.findById(userId);
		const company = await Company.findOne({companyID: companyBusinessId});
		if (!user || !company)
			throw new Error('User or Company not found for preference creation.');

		const existing = await UserCompanyPreference.findOne({
			userId: user._id,
			companyId: company._id,
		});
		if (existing) throw new Error('Preference already exists.');

		const pref = new UserCompanyPreference({
			...data,
			userId: user._id,
			companyId: company._id,
		});
		await pref.save();
		return pref;
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
		data: {rank?: number; isTracking?: boolean; frequency?: string},
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

	/**
	 * Delete a user-company preference by its MongoDB _id
	 */
	static async deleteById(prefId: string) {
		return UserCompanyPreference.findByIdAndDelete(prefId);
	}
}
