import {UserService} from '@/services/userService';
import {EnhancedLogger} from '@/utils/enhancedLogger';
import dbConnect from '@/middleware/database';

const logger = EnhancedLogger.getLogger('DeprecatedTrackedCompaniesAPI', {
	logToFile: true,
	logToConsole: true,
	logDir: '/tmp/scoutly-logs',
	logFileName: 'deprecated-tracked-companies-api.log',
});

/**
 * @deprecated Use /api/user-company-preferences instead
 * GET /api/users/tracked-companies
 * Get user's tracked companies
 */
export async function GET(request: Request) {
	try {
		await dbConnect();

		// For development, use the test email
		const email = 'judithv.sanchezc@gmail.com';

		const user = await UserService.getUserByEmail(email);
		if (!user) {
			return Response.json({companies: []});
		}

		// Return the full tracked companies array with companyID and ranking
		return Response.json({companies: user.trackedCompanies || []});
	} catch (error: any) {
		logger.error('Error fetching tracked companies:', error);
		return Response.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}

/**
 * @deprecated Use POST /api/user-company-preferences instead
 * POST /api/users/tracked-companies
 * Start tracking a company
 */
export async function POST(request: Request) {
	try {
		await dbConnect();

		// Extract request data and ensure we have the correct property names
		const requestData = await request.json();
		const companyId = requestData.companyId;
		const ranking = requestData.ranking || 75;
		const email = 'judithv.sanchezc@gmail.com'; // For development

		if (!companyId) {
			return Response.json({error: 'Company ID is required'}, {status: 400});
		}

		const user = await UserService.addTrackedCompany(email, companyId, ranking);
		return Response.json({
			success: true,
			companies: user.trackedCompanies,
			message: 'Company tracked successfully',
		});
	} catch (error: any) {
		logger.error('Error tracking company:', error);
		return Response.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}
