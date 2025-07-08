export const dynamic = 'force-dynamic';

import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants';
import {CompanyService} from '@/services/companyService';
import {logger} from '@/utils/logger';

// POST /api/companies/create
export async function POST(request: NextRequest) {
	await logger.debug(`POST ${endpoint.companies.create} called`, {
		env: {...env},
		deployment: {...deployment},
	});

	const reqBody = await request.json();

	if (env.isDev) {
		await logger.info('Environment: Development - creating company directly');
		try {
			const company = await CompanyService.createCompany(reqBody);
			return NextResponse.json(company, {status: 201});
		} catch (error) {
			await logger.error('Error creating company (dev)', error);
			return NextResponse.json(
				{
					error: 'Error creating company',
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
			await logger.debug('Proxying create company to backend API', {
				url: `${apiUrl}${endpoint.companies.create}`,
			});
			const response = await fetch(`${apiUrl}${endpoint.companies.create}`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify(reqBody),
			});
			const data = await response.json();
			if (!response.ok) {
				await logger.error('Failed to create company via backend API', {
					status: response.status,
				});
				return NextResponse.json(
					{error: data.error || 'Failed to create company via backend API'},
					{status: response.status},
				);
			}
			await logger.info('Company created via backend API');
			return NextResponse.json(data, {status: 201});
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

	if (env.isProd && deployment.isPi) {
		await logger.info(
			'Environment: Production on Pi - creating company directly',
		);
		try {
			const company = await CompanyService.createCompany(reqBody);
			return NextResponse.json(company, {status: 201});
		} catch (error) {
			await logger.error('Error creating company (prod/pi)', error);
			return NextResponse.json(
				{
					error: 'Error creating company',
					details: (error as Error).message,
				},
				{status: 500},
			);
		}
	}
}
