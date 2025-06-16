import {UserService} from '@/services/userService';
import {Logger} from '@/utils/logger';
import dbConnect from '@/middleware/database';

const logger = new Logger('TrackedCompaniesAPI');

// GET /api/users/tracked-companies
// Get user's tracked companies
export async function GET(request: Request) {
	try {
		await dbConnect();

		// For development, use the test email
		const email = 'judithv.sanchezc@gmail.com';

		const user = await UserService.getUserByEmail(email);
		if (!user) {
			return Response.json({companies: []});
		}

		return Response.json({companies: user.trackedCompanies || []});
	} catch (error: any) {
		logger.error('Error fetching tracked companies:', error);
		return Response.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}

// POST /api/users/tracked-companies
// Start tracking a company
export async function POST(request: Request) {
	try {
		await dbConnect();

		const {companyId} = await request.json();
		const email = 'judithv.sanchezc@gmail.com'; // For development

		if (!companyId) {
			return Response.json({error: 'Company ID is required'}, {status: 400});
		}

		const user = await UserService.addTrackedCompany(email, companyId);
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
