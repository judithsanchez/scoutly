import {NextResponse} from 'next/server';
import {User} from '@/models/User';
import connectToDB from '@/lib/db';
import {Logger} from '@/utils/logger';

const logger = new Logger('InternalSignInAPI');

// This is a security measure to ensure that this internal endpoint is not publicly accessible.
// This secret should be set as an environment variable on both the Vercel and Raspberry Pi environments.
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

export async function POST(req: Request) {
	const secret = req.headers.get('X-Internal-API-Secret');
	if (secret !== INTERNAL_API_SECRET) {
		logger.warn('Unauthorized attempt to access internal sign-in API');
		return NextResponse.json({error: 'Unauthorized'}, {status: 401});
	}

	try {
		await connectToDB();

		const {email} = await req.json();

		if (!email) {
			logger.warn('Sign-in rejected: No email provided');
			return NextResponse.json(
				{approved: false, message: 'No email provided'},
				{status: 400},
			);
		}

		const existingUser = await User.findOne({email: email.toLowerCase()});

		if (!existingUser) {
			logger.info(`Sign-in rejected: User ${email} is not pre-approved`);
			return NextResponse.json(
				{approved: false, message: 'User not pre-approved'},
				{status: 403},
			);
		}

		logger.info(`Sign-in approved: User ${email} found in database`);
		return NextResponse.json({approved: true});
	} catch (error) {
		logger.error('Error during internal sign-in check:', error);
		return NextResponse.json(
			{approved: false, message: 'Internal server error'},
			{status: 500},
		);
	}
}
