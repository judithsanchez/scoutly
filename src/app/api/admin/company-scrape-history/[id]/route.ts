import {NextRequest, NextResponse} from 'next/server';
import {requireAuth} from '@/utils/requireAuth';
import {AdminService} from '@/services/adminService';
import {deployment, env, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants/apiEndpoints';
import {proxyToBackend} from '@/utils/proxyToBackend';

export async function DELETE(
	req: NextRequest,
	{params}: {params: {id: string}},
) {
	if (deployment.isVercel && env.isProd) {
		const apiUrlFull = `${apiBaseUrl.prod}${endpoint.admin.company_scrape_history}/${params.id}`;
		return proxyToBackend({
			request: req,
			backendUrl: apiUrlFull,
			methodOverride: 'DELETE',
			logPrefix: '[ADMIN][COMPANY_SCRAPE_HISTORY][PROXY][DELETE]',
		});
	}

	const {user, response} = await requireAuth(req);
	if (!user) {
		return response as Response;
	}

	try {
		await AdminService.deleteCompanyScrapeHistoryById(params.id, user);
		return NextResponse.json({success: true});
	} catch (err: any) {
		return NextResponse.json(
			{error: err.message || 'Failed to delete scrape history'},
			{status: 403},
		);
	}
}
