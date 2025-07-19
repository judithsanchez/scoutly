import {NextRequest, NextResponse} from 'next/server';

import {corsOptionsResponse, addCorsHeaders} from '@/utils/cors';
import {deployment, env, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants/apiEndpoints';
import {proxyToBackend} from '@/utils/proxyToBackend';
import {requireAuth} from '@/utils/requireAuth';
import {AdminService} from '@/services/adminService';

export async function OPTIONS() {
	return corsOptionsResponse('admin/company-scrape-history');
}

export async function GET(req: NextRequest) {
	if (deployment.isVercel && env.isProd) {
		const apiUrlFull = `${apiBaseUrl.prod}${endpoint.admin.company_scrape_history}`;
		return proxyToBackend({
			request: req,
			backendUrl: apiUrlFull,
			methodOverride: 'GET',
			logPrefix: '[ADMIN][COMPANY_SCRAPE_HISTORY][PROXY]',
		});
	}

	const {user, response} = await requireAuth(req);
	if (!user) {
		return response as Response;
	}

	// Check if user is admin by userId
	// Check if user is admin by email (using AdminUser collection)
	let email: string | undefined;
	if (typeof user === 'object' && user !== null && 'email' in user) {
		email = (user as any).email;
	}
	if (!email) {
		return addCorsHeaders(
			NextResponse.json({error: 'Invalid user payload'}, {status: 401}),
			'admin/company-scrape-history',
		);
	}
	const isAdmin = await AdminService.isUserAdmin(email);
	if (!isAdmin) {
		return addCorsHeaders(
			NextResponse.json({error: 'Forbidden: Admins only'}, {status: 403}),
			'admin/company-scrape-history',
		);
	}

	const url = req.nextUrl;
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);
	const result = await AdminService.getCompanyScrapeHistory({page, pageSize});
	return addCorsHeaders(
		NextResponse.json(result),
		'admin/company-scrape-history',
	);
}
