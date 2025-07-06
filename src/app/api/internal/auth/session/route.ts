import {NextResponse} from 'next/server';
import {User} from '@/models/User';
import {AdminUser} from '@/models/AdminUser';
import connectToDB from '@/lib/db';
import {Logger} from '@/utils/logger';
import {getProfileCompleteness} from '@/lib/validateProfile';

const logger = new Logger('InternalSessionAPI');

const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

export async function GET(req: Request) {
	const secret = req.headers.get('X-Internal-API-Secret');
	if (secret !== INTERNAL_API_SECRET) {
		logger.warn('Unauthorized attempt to access internal session API');
		return NextResponse.json({error: 'Unauthorized'}, {status: 401});
	}

	try {
		await connectToDB();

		const {searchParams} = new URL(req.url);
		const email = searchParams.get('email');

		if (!email) {
			logger.warn('Session fetch rejected: No email provided');
			return NextResponse.json({error: 'No email provided'}, {status: 400});
		}

		const userData = await User.findOne({email: email.toLowerCase()});
		if (!userData) {
			logger.warn(`Session fetch: User not found for email: ${email}`);
			return NextResponse.json({error: 'User not found'}, {status: 404});
		}

		const isAdmin = await AdminUser.findOne({email: email.toLowerCase()});

		const plainUser = userData.toObject
			? userData.toObject()
			: JSON.parse(JSON.stringify(userData));
		const {isComplete: hasCompleteProfile} = getProfileCompleteness(plainUser);

		const sessionData = {
			isAdmin: !!isAdmin,
			hasCompleteProfile,
			email: userData.email,
		};

		logger.info(`Session data retrieved for ${email}`);
		return NextResponse.json(sessionData);
	} catch (error) {
		logger.error('Error during internal session fetch:', error);
		return NextResponse.json({error: 'Internal server error'}, {status: 500});
	}
}
