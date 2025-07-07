export const dynamic = 'force-dynamic';
import {NextRequest, NextResponse} from 'next/server';
import dbConnect from '@/middleware/database';
import {UserCompanyPreferenceService} from '@/services/userCompanyPreferenceService';
import {UserService} from '@/services/userService';
import {EnhancedLogger} from '@/utils/enhancedLogger';

const logger = EnhancedLogger.getLogger('UserCompanyPreferencesByIdAPI', {
	logToFile: true,
	logToConsole: true,
	logDir: '/tmp/scoutly-logs',
	logFileName: 'user-company-preferences-by-id-api.log',
});

/**
 * DELETE /api/user-company-preferences/[companyId]
 *
 * Remove a company from the user's tracked companies by setting isTracking to false
 */
export async function DELETE(
	req: NextRequest,
	{params}: {params: {companyId: string}},
) {
	try {
		await dbConnect();

		// Development bypass for auth - use hardcoded email
		const userEmail = 'judithv.sanchezc@gmail.com';
		logger.info(`Using dev bypass auth with email: ${userEmail}`);

		// Get user by email to get the userId
		const user = await UserService.getUserByEmail(userEmail);
		if (!user) {
			return NextResponse.json({error: 'User not found'}, {status: 404});
		}

		const {companyId} = params;

		if (!companyId) {
			return NextResponse.json(
				{error: 'Company ID is required'},
				{status: 400},
			);
		}

		// Set isTracking to false using the new service
		const preference = await UserCompanyPreferenceService.upsert(
			(user._id as any).toString(),
			companyId,
			{isTracking: false},
		);

		logger.info(
			`Set isTracking to false for company ${companyId} for user ${userEmail}`,
		);

		return NextResponse.json({
			success: true,
			preference,
		});
	} catch (error: any) {
		logger.error('Error removing company preference:', error);
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}

/**
 * PUT /api/user-company-preferences/[companyId]
 *
 * Update a company's preferences (rank, isTracking) for the user
 */
export async function PUT(
	req: NextRequest,
	{params}: {params: {companyId: string}},
) {
	try {
		await dbConnect();

		// Development bypass for auth - use hardcoded email
		const userEmail = 'judithv.sanchezc@gmail.com';
		logger.info(`Using dev bypass auth with email: ${userEmail}`);

		// Get user by email to get the userId
		const user = await UserService.getUserByEmail(userEmail);
		if (!user) {
			return NextResponse.json({error: 'User not found'}, {status: 404});
		}

		const {companyId} = params;
		const body = await req.json();
		const {rank, isTracking} = body;

		if (!companyId) {
			return NextResponse.json(
				{error: 'Company ID is required'},
				{status: 400},
			);
		}

		// Validate rank if provided
		if (rank !== undefined && (rank < 1 || rank > 100)) {
			return NextResponse.json(
				{error: 'Rank must be between 1 and 100'},
				{status: 400},
			);
		}

		// Prepare update data
		const updateData: {rank?: number; isTracking?: boolean} = {};
		if (rank !== undefined) updateData.rank = rank;
		if (isTracking !== undefined) updateData.isTracking = isTracking;

		// Update the preference using the new service
		const preference = await UserCompanyPreferenceService.upsert(
			(user._id as any).toString(),
			companyId,
			updateData,
		);

		logger.info(
			`Updated preference for company ${companyId} for user ${userEmail}`,
			{updateData},
		);

		return NextResponse.json({
			success: true,
			preference,
		});
	} catch (error: any) {
		logger.error('Error updating company preference:', error);
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}
