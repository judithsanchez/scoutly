import {UserService} from '@/services/userService';
import {Logger} from '@/utils/logger';
import dbConnect from '@/middleware/database';

const logger = new Logger('UntrackCompanyAPI');

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
