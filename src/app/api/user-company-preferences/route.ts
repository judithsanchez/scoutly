import {NextRequest, NextResponse} from 'next/server';
import dbConnect from '@/middleware/database';
import {User} from '@/models/User';
import {Company} from '@/models/Company';
import {EnhancedLogger} from '@/utils/enhancedLogger';
import {UserService} from '@/services/userService';

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

		// Development bypass for auth - use hardcoded email
		const userEmail = 'judithv.sanchezc@gmail.com';
		logger.info(`Using dev bypass auth with email: ${userEmail}`);

		// Get the user with their tracked companies
		const user = await User.findOne({email: userEmail});
		if (!user) {
			return NextResponse.json({error: 'User not found'}, {status: 404});
		}

		// If user has no tracked companies, return empty array
		if (!user.trackedCompanies || user.trackedCompanies.length === 0) {
			logger.info(`User ${userEmail} has no tracked companies`);
			return NextResponse.json({companies: []});
		}

		// Get the company details for tracked companies
		const companyIds = user.trackedCompanies.map((tc: any) => tc.companyID);
		const companies = await Company.find({companyID: {$in: companyIds}});

		// Build the response with company details and user preferences
		const trackedCompanies = companies.map(company => {
			const userTrackingInfo = user.trackedCompanies.find(
				(tc: any) => tc.companyID === company.companyID,
			);

			return {
				_id: company._id,
				companyID: company.companyID,
				company: company.company,
				careers_url: company.careers_url,
				logo_url: company.logo_url,
				work_model: company.work_model,
				headquarters: company.headquarters,
				office_locations: company.office_locations,
				fields: company.fields,
				userPreference: {
					rank: userTrackingInfo?.ranking || 75,
					isTracking: true,
					frequency: getRankingFrequency(userTrackingInfo?.ranking || 75),
					lastUpdated: user.updatedAt,
				},
			};
		});

		logger.info(
			`Retrieved ${trackedCompanies.length} tracked companies for user ${userEmail}`,
		);

		return NextResponse.json({companies: trackedCompanies});
	} catch (error: any) {
		logger.error('Error getting tracked companies:', error);
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
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

		// Development bypass for auth - use hardcoded email
		const userEmail = 'judithv.sanchezc@gmail.com';
		logger.info(`Using dev bypass auth with email: ${userEmail}`);

		// Parse request body
		const {companyId, rank = 75, isTracking = true} = await req.json();

		if (!companyId) {
			return NextResponse.json(
				{error: 'Company ID is required'},
				{status: 400},
			);
		}

		// Verify company exists
		const company = await Company.findOne({companyID: companyId});
		if (!company) {
			return NextResponse.json({error: 'Company not found'}, {status: 404});
		}

		// Add the company to user's tracked companies using UserService
		const user = await UserService.addTrackedCompany(
			userEmail,
			companyId,
			rank,
		);

		logger.info(
			`Added company ${companyId} to tracked companies for user ${userEmail}`,
		);

		return NextResponse.json({
			success: true,
			message: 'Company preference updated successfully',
		});
	} catch (error: any) {
		logger.error('Error updating company preference:', error);
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}

// Helper function to convert ranking to frequency description
function getRankingFrequency(ranking: number): string {
	if (ranking >= 90) return 'Daily';
	if (ranking >= 80) return 'Every 2 days';
	if (ranking >= 70) return 'Weekly';
	if (ranking >= 60) return 'Bi-weekly';
	return 'Monthly';
}
