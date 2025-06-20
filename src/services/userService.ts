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
}
