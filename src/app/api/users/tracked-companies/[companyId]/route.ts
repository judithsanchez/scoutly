import {UserService} from '@/services/userService';
import {EnhancedLogger} from '@/utils/enhancedLogger';
import dbConnect from '@/middleware/database';

const logger = EnhancedLogger.getLogger('DeprecatedTrackedCompanyAPI', {
	logToFile: true,
	logToConsole: true,
	logDir: '/tmp/scoutly-logs',
	logFileName: 'deprecated-tracked-company-api.log',
});

/**
 * @deprecated Use DELETE /api/user-company-preferences/[companyId] instead
 */
export async function DELETE(
	request: Request,
	{params}: {params: {companyId: string}},
) {
	try {
		await dbConnect();

		const {companyId} = params;
		const email = 'judithv.sanchezc@gmail.com'; // For development

		const user = await UserService.removeTrackedCompany(email, companyId);
		return Response.json({
			success: true,
			companies: user.trackedCompanies,
			message: 'Company untracked successfully',
		});
	} catch (error: any) {
		logger.error('Error untracking company:', error);
		return Response.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}

/**
 * @deprecated Use PUT /api/user-company-preferences/[companyId] instead
 */
export async function PUT(
	request: Request,
	{params}: {params: {companyId: string}},
) {
	try {
		await dbConnect();

		const {companyId} = params;
		const {ranking} = await request.json();
		const email = 'judithv.sanchezc@gmail.com'; // For development

		if (ranking === undefined) {
			return Response.json({error: 'Ranking is required'}, {status: 400});
		}

		const user = await UserService.updateTrackedCompanyRanking(
			email,
			companyId,
			ranking,
		);

		return Response.json({
			success: true,
			companies: user.trackedCompanies,
			message: 'Company ranking updated successfully',
		});
	} catch (error: any) {
		logger.error('Error updating company ranking:', error);
		return Response.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}
