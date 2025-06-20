import {NextRequest, NextResponse} from 'next/server';
import dbConnect from '@/middleware/database';
import {UserCompanyPreferenceService} from '@/services/userCompanyPreferenceService';
import {UserService} from '@/services/userService';
import {EnhancedLogger} from '@/utils/enhancedLogger';

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

		// Get user by email to get the userId
		const user = await UserService.getUserByEmail(userEmail);
		if (!user) {
			return NextResponse.json({error: 'User not found'}, {status: 404});
		}

		// Get user's tracked company preferences using the new service
		const preferences = await UserCompanyPreferenceService.findByUserId(
			(user._id as any).toString(),
		);

		// Transform the data to match the expected API response format
		const trackedCompanies = preferences.map(preference => {
			const company = preference.companyId as any; // Populated company data

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
					rank: preference.rank,
					isTracking: preference.isTracking,
					frequency: getRankingFrequency(preference.rank),
					lastUpdated: preference.updatedAt,
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

		// Get user by email to get the userId
		const user = await UserService.getUserByEmail(userEmail);
		if (!user) {
			return NextResponse.json({error: 'User not found'}, {status: 404});
		}

		// Parse request body
		const {companyId, rank = 75, isTracking = true} = await req.json();

		if (!companyId) {
			return NextResponse.json({error: 'companyId is required'}, {status: 400});
		}

		// Create or update the preference using the new service
		const preference = await UserCompanyPreferenceService.upsert(
			(user._id as any).toString(),
			companyId,
			{rank, isTracking},
		);

		logger.info(
			`Updated company preference for ${companyId} for user ${userEmail}`,
		);

		return NextResponse.json(
			{
				success: true,
				preference,
			},
			{status: 201},
		);
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
