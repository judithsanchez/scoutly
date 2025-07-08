import {UserCompanyPreference} from '@/models/UserCompanyPreference';
import {User} from '@/models/User';

export class UserCompanyPreferenceService {
	static async getByUserId(userId: string) {
		return UserCompanyPreference.find({userId});
	}

	static async getByEmail(email: string) {
		const user = await User.findOne({email});
		if (!user) return [];
		return UserCompanyPreference.find({userId: user._id});
	}
}
