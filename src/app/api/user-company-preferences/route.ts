import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import dbConnect from '@/middleware/database';
import {User} from '@/models/User';
import {EnhancedLogger} from '@/utils/enhancedLogger';
import {UserCompanyPreferenceService} from '@/services/userCompanyPreferenceService';

const logger = EnhancedLogger.getLogger('UserCompanyPreferencesAPI', {
	logToFile: true,
	logToConsole: true,
	logDir: '/tmp/scoutly-logs',
	logFileName: 'user-company-preferences-api.log',
});

/**
 * GET /api/user-company-preferences
 *
 * Returns all tracked companies for the current user with their preferences
 */
export async function GET(req: NextRequest) {
	try {
		await dbConnect();

		// Get the authenticated user from the session
		const session = await getServerSession(authOptions);
		let userEmail;

		// Development bypass for auth
		if (
			process.env.NODE_ENV === 'development' &&
			process.env.NEXT_PUBLIC_SKIP_AUTH === 'true'
		) {
			userEmail = process.env.NEXT_PUBLIC_DEV_USER_EMAIL || 'dev@scoutly.app';
			logger.info(`Using dev bypass auth with email: ${userEmail}`);
		} else if (!session?.user?.email) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401});
		} else {
			userEmail = session.user.email;
		}

		// Get the user ID
		const user = await User.findOne({email: userEmail});
		if (!user) {
			return NextResponse.json({error: 'User not found'}, {status: 404});
		}

		// Get tracked companies with preferences using the service
		const trackedCompanies =
			await UserCompanyPreferenceService.getTrackedCompanies(user.id);

		logger.info(
			`Retrieved ${trackedCompanies.length} tracked companies for user ${user.email}`,
		);

		return NextResponse.json({companies: trackedCompanies});
	} catch (error: any) {
		logger.error('Error retrieving tracked companies:', error);
		return NextResponse.json(
			{error: error.message || 'Failed to retrieve tracked companies'},
			{status: 500},
		);
	}
}

/**
 * POST /api/user-company-preferences
 *
 * Add or update a company preference for the current user
 *
 * Request body:
 * {
 *   companyId: string,
 *   rank: number,
 *   isTracking: boolean
 * }
 */
export async function POST(req: NextRequest) {
	try {
		await dbConnect();

		// Get the authenticated user from the session
		const session = await getServerSession(authOptions);
		let userEmail;

		// Development bypass for auth
		if (
			process.env.NODE_ENV === 'development' &&
			process.env.NEXT_PUBLIC_SKIP_AUTH === 'true'
		) {
			userEmail = process.env.NEXT_PUBLIC_DEV_USER_EMAIL || 'dev@scoutly.app';
			logger.info(`Using dev bypass auth with email: ${userEmail}`);
		} else if (!session?.user?.email) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401});
		} else {
			userEmail = session.user.email;
		}

		// Get the user ID
		const user = await User.findOne({email: userEmail});
		if (!user) {
			return NextResponse.json({error: 'User not found'}, {status: 404});
		}

		// Parse request body
		const body = await req.json();
		const {companyId, rank, isTracking = true} = body;

		if (!companyId || typeof companyId !== 'string') {
			return NextResponse.json(
				{error: 'Company ID is required'},
				{status: 400},
			);
		}

		if (!rank || typeof rank !== 'number' || rank < 1 || rank > 100) {
			return NextResponse.json(
				{error: 'Rank must be a number between 1 and 100'},
				{status: 400},
			);
		}

		// Update or create the preference
		const preference = await UserCompanyPreferenceService.setCompanyPreference(
			user.id,
			companyId,
			rank,
			isTracking,
		);

		logger.info(
			`Updated preference for company ${companyId} for user ${user.email}`,
		);

		return NextResponse.json({
			success: true,
			preference,
		});
	} catch (error: any) {
		logger.error('Error updating company preference:', error);
		return NextResponse.json(
			{error: error.message || 'Failed to update company preference'},
			{status: 500},
		);
	}
}
