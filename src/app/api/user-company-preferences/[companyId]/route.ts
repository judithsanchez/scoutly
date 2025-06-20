import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import dbConnect from '@/middleware/database';
import {User} from '@/models/User';
import {EnhancedLogger} from '@/utils/enhancedLogger';
import {UserCompanyPreferenceService} from '@/services/userCompanyPreferenceService';

const logger = EnhancedLogger.getLogger('UserCompanyPreferenceAPI', {
	logToFile: true,
	logToConsole: true,
	logDir: '/tmp/scoutly-logs',
	logFileName: 'user-company-preference-api.log',
});

/**
 * GET /api/user-company-preferences/[companyId]
 *
 * Returns the preference for a specific company
 */
export async function GET(
	req: NextRequest,
	{params}: {params: {companyId: string}},
) {
	try {
		await dbConnect();

		const {companyId} = params;

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

		// Get the company preference
		const preference = await UserCompanyPreferenceService.getCompanyPreference(
			user.id,
			companyId,
		);

		if (!preference) {
			return NextResponse.json(
				{error: 'Company preference not found'},
				{status: 404},
			);
		}

		return NextResponse.json({preference});
	} catch (error: any) {
		logger.error(
			`Error retrieving company preference for company ID ${params.companyId}:`,
			error,
		);
		return NextResponse.json(
			{error: error.message || 'Failed to retrieve company preference'},
			{status: 500},
		);
	}
}

/**
 * PUT /api/user-company-preferences/[companyId]
 *
 * Update a company preference
 *
 * Request body:
 * {
 *   rank: number,
 *   isTracking: boolean
 * }
 */
export async function PUT(
	req: NextRequest,
	{params}: {params: {companyId: string}},
) {
	try {
		await dbConnect();

		const {companyId} = params;

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
		const {rank, isTracking} = body;

		// Validate rank if provided
		if (
			rank !== undefined &&
			(typeof rank !== 'number' || rank < 1 || rank > 100)
		) {
			return NextResponse.json(
				{error: 'Rank must be a number between 1 and 100'},
				{status: 400},
			);
		}

		// Update the preference
		const updatedPreference =
			await UserCompanyPreferenceService.updateCompanyPreference(
				user.id,
				companyId,
				{rank, isTracking},
			);

		if (!updatedPreference) {
			return NextResponse.json(
				{error: 'Company preference not found'},
				{status: 404},
			);
		}

		logger.info(
			`Updated preference for company ${companyId} for user ${user.email}`,
		);

		return NextResponse.json({preference: updatedPreference});
	} catch (error: any) {
		logger.error(
			`Error updating company preference for company ID ${params.companyId}:`,
			error,
		);
		return NextResponse.json(
			{error: error.message || 'Failed to update company preference'},
			{status: 500},
		);
	}
}

/**
 * DELETE /api/user-company-preferences/[companyId]
 *
 * Delete a company preference (stop tracking)
 */
export async function DELETE(
	req: NextRequest,
	{params}: {params: {companyId: string}},
) {
	try {
		await dbConnect();

		const {companyId} = params;

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

		// Delete the preference (or set isTracking to false)
		const result = await UserCompanyPreferenceService.stopTrackingCompany(
			user.id,
			companyId,
		);

		if (!result.success) {
			return NextResponse.json(
				{error: 'Company preference not found'},
				{status: 404},
			);
		}

		logger.info(`Stopped tracking company ${companyId} for user ${user.email}`);

		return NextResponse.json({success: true});
	} catch (error: any) {
		logger.error(
			`Error deleting company preference for company ID ${params.companyId}:`,
			error,
		);
		return NextResponse.json(
			{error: error.message || 'Failed to delete company preference'},
			{status: 500},
		);
	}
}
