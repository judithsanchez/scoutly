import {NextRequest, NextResponse} from 'next/server';
import dbConnect from '@/middleware/database';
import {User} from '@/models/User';
import {Company} from '@/models/Company';
import {EnhancedLogger} from '@/utils/enhancedLogger';
import {UserService} from '@/services/userService';

const logger = EnhancedLogger.getLogger('UserCompanyPreferencesByIdAPI', {
	logToFile: true,
	logToConsole: true,
	logDir: '/tmp/scoutly-logs',
	logFileName: 'user-company-preferences-by-id-api.log',
});

/**
 * DELETE /api/user-company-preferences/[companyId]
 *
 * Remove a company from the user's tracked companies
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

		const {companyId} = params;

		if (!companyId) {
			return NextResponse.json(
				{error: 'Company ID is required'},
				{status: 400},
			);
		}

		// Remove the company from user's tracked companies using UserService
		const user = await UserService.removeTrackedCompany(userEmail, companyId);

		logger.info(
			`Removed company ${companyId} from tracked companies for user ${userEmail}`,
		);

		return NextResponse.json({
			success: true,
			message: 'Company preference removed successfully',
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
 * Update a company's rank for the user
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

		const {companyId} = params;
		const {rank} = await req.json();

		if (!companyId) {
			return NextResponse.json(
				{error: 'Company ID is required'},
				{status: 400},
			);
		}

		if (rank === undefined || rank < 0 || rank > 100) {
			return NextResponse.json(
				{error: 'Rank must be between 0 and 100'},
				{status: 400},
			);
		}

		// Update the company's rank using UserService
		const user = await UserService.updateTrackedCompanyRanking(
			userEmail,
			companyId,
			rank,
		);

		logger.info(
			`Updated rank for company ${companyId} to ${rank} for user ${userEmail}`,
		);

		return NextResponse.json({
			success: true,
			message: 'Company rank updated successfully',
		});
	} catch (error: any) {
		logger.error('Error updating company rank:', error);
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}
