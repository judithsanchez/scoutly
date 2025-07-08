import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants';
import {logger} from '@/utils/logger';

let AdminService: any;
try {
	AdminService = require('@/services/adminService').AdminService;
} catch {}

export async function POST(req: NextRequest) {
	await logger.debug(`POST ${endpoint.admin.seed_companies} called`, {
		env: {...env},
		deployment: {...deployment},
	});

	const secret = req.headers.get('X-Internal-API-Secret');
	if (secret !== process.env.INTERNAL_API_SECRET) {
		await logger.warn('Unauthorized seed-companies attempt');
		return NextResponse.json({error: 'Unauthorized'}, {status: 401});
	}

	if (env.isDev || (env.isProd && deployment.isPi)) {
		if (!AdminService) {
			await logger.error('AdminService not implemented');
			return NextResponse.json(
				{error: 'AdminService not implemented'},
				{status: 501},
			);
		}
		try {
			const result = await AdminService.seedCompanies();
			return NextResponse.json(result);
		} catch (error) {
			await logger.error('Error seeding companies', error);
			return NextResponse.json(
				{
					error: 'Error seeding companies',
					details: (error as Error).message,
				},
				{status: 500},
			);
		}
	}

	if (env.isProd && deployment.isVercel) {
		await logger.info(
			'Environment: Production on Vercel - proxying to backend API',
		);
		const apiUrl = apiBaseUrl.prod;
		if (!apiUrl) {
			await logger.error('Backend API URL not configured');
			return NextResponse.json(
				{error: 'Backend API URL not configured'},
				{status: 500},
			);
		}
		try {
			await logger.debug('Proxying seed-companies to backend API', {
				url: `${apiUrl}${endpoint.admin.seed_companies}`,
			});
			const response = await fetch(
				`${apiUrl}${endpoint.admin.seed_companies}`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-Internal-API-Secret': secret || '',
					},
				},
			);
			const data = await response.json();
			if (!response.ok) {
				await logger.error('Failed to seed companies via backend API', {
					status: response.status,
				});
				return NextResponse.json(
					{error: data.error || 'Failed to seed companies via backend API'},
					{status: response.status},
				);
			}
			await logger.info('Companies seeded via backend API');
			return NextResponse.json(data);
		} catch (error) {
			await logger.error('Error connecting to backend API', error);
			return NextResponse.json(
				{
					error: 'Error connecting to backend API',
					details: (error as Error).message,
				},
				{status: 500},
			);
		}
	}
}
