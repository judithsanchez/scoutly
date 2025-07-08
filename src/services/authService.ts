import {User} from '@/models/User';
import {AdminUser} from '@/models/AdminUser';

export class AuthService {
	static async findUserByEmail(email: string) {
		return User.findOne({email: email.toLowerCase()});
	}

	static async createUserIfNotExists(email: string, profile: any) {
		let user = await User.findOne({email: email.toLowerCase()});
		if (!user) {
			user = await User.create({
				email: email.toLowerCase(),
				...profile,
			});
		}
		return user;
	}

	static async isAdmin(email: string) {
		return !!(await AdminUser.findOne({email: email.toLowerCase()}));
	}

	static async hasCompleteProfile(user: any) {
		return !!(user?.cvUrl && user?.candidateInfo);
	}

	static async getUserSessionInfo(email: string) {
		const user = await this.findUserByEmail(email);
		if (!user) return null;
		return {
			email: user.email,
			isAdmin: await this.isAdmin(user.email),
			hasCompleteProfile: await this.hasCompleteProfile(user),
			cvUrl: user.cvUrl,
		};
	}
}
