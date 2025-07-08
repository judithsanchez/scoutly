export const dynamic = 'force-dynamic';
import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants';

import {CompanyService} from '@/services/companyService';
import {logger} from '@/utils/logger';

export async function GET(request: NextRequest) {
	await logger.debug(`GET ${endpoint.companies.list} called`, {
		env: {...env},
		deployment: {...deployment},
	});

	if (env.isDev) {
		await logger.info('Environment: Development - querying database directly');
		try {
			const companies = await CompanyService.getAllCompanies();
			return NextResponse.json(companies);
		} catch (error) {
			await logger.error('Error fetching companies from database (dev)', error);
			return NextResponse.json(
				{
					error: 'Error fetching companies from database',
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
			await logger.debug('Fetching companies from backend API', {
				url: `${apiUrl}${endpoint.companies.list}`,
			});
			const response = await fetch(`${apiUrl}${endpoint.companies.list}`);
			if (!response.ok) {
				await logger.error('Failed to fetch companies from backend API', {
					status: response.status,
				});
				return NextResponse.json(
					{error: 'Failed to fetch companies from backend API'},
					{status: response.status},
				);
			}
			const companies = await response.json();
			await logger.info('Companies fetched from backend API', {
				count: Array.isArray(companies) ? companies.length : undefined,
			});
			return NextResponse.json(companies);
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
			'Environment: Production on Pi - querying database directly',
		);
		try {
			const companies = await CompanyService.getAllCompanies();
			return NextResponse.json(companies);
		} catch (error) {
			await logger.error(
				'Error fetching companies from database (prod/pi)',
				error,
			);
			return NextResponse.json(
				{
					error: 'Error fetching companies from database',
					details: (error as Error).message,
				},
				{status: 500},
			);
		}
	}
}
