import connectToDB from '@/lib/db';
import {User} from '@/models/User';
import {AdminUser} from '@/models/AdminUser';
import {Logger} from '@/utils/logger';

const logger = new Logger('AuthService');

export class AuthService {
	static async findUserByEmail(email: string) {
		await connectToDB();
		await logger.debug('findUserByEmail called', {email});
		try {
			const user = await User.findOne({email: email.toLowerCase()});
			await logger.info('User lookup result', {email, found: !!user});
			return user;
		} catch (error) {
			await logger.error('Error in findUserByEmail', error);
			throw error;
		}
	}

	static async createUserIfNotExists(email: string, profile: any) {
		await connectToDB();
		await logger.debug('createUserIfNotExists called', {email, profile});
		try {
			let user = await User.findOne({email: email.toLowerCase()});
			if (!user) {
				user = await User.create({
					email: email.toLowerCase(),
					...profile,
				});
				await logger.info('User created', {email});
			} else {
				await logger.info('User already exists', {email});
			}
			return user;
		} catch (error) {
			await logger.error('Error in createUserIfNotExists', error);
			throw error;
		}
	}

	static async isAdmin(email: string) {
		await connectToDB();
		await logger.debug('isAdmin called', {email});
		try {
			const admin = await AdminUser.findOne({email: email.toLowerCase()});
			await logger.info('Admin check result', {email, isAdmin: !!admin});
			return !!admin;
		} catch (error) {
			await logger.error('Error in isAdmin', error);
			throw error;
		}
	}

	static async hasCompleteProfile(user: any) {
		// No DB query here, so no need to connect
		await logger.debug('hasCompleteProfile called', {
			userId: user?._id,
			email: user?.email,
		});
		try {
			const complete = !!(user?.cvUrl && user?.candidateInfo);
			await logger.info('Profile completeness check', {
				email: user?.email,
				complete,
			});
			return complete;
		} catch (error) {
			await logger.error('Error in hasCompleteProfile', error);
			throw error;
		}
	}

	static async getUserSessionInfo(email: string) {
		await connectToDB();
		await logger.debug('getUserSessionInfo called', {email});
		try {
			const user = await this.findUserByEmail(email);
			if (!user) {
				await logger.warn('User not found in getUserSessionInfo', {email});
				return null;
			}
			const isAdmin = await this.isAdmin(user.email);
			const hasCompleteProfile = await this.hasCompleteProfile(user);
			await logger.info('User session info assembled', {
				email,
				isAdmin,
				hasCompleteProfile,
			});
			return {
				email: user.email,
				isAdmin,
				hasCompleteProfile,
				cvUrl: user.cvUrl,
			};
		} catch (error) {
			await logger.error('Error in getUserSessionInfo', error);
			throw error;
		}
	}
}
