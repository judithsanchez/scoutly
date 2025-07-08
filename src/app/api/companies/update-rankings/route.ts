export const dynamic = 'force-dynamic';

import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants';
import {logger} from '@/utils/logger';

// POST /api/companies/update-rankings
export async function POST(request: NextRequest) {
	await logger.debug(`POST ${endpoint.companies.update_rankings} called`, {
		env: {...env},
		deployment: {...deployment},
	});

	const reqBody = await request.json();

	if (env.isDev) {
		await logger.warn('Update rankings is not implemented for dev environment');
		return NextResponse.json(
			{error: 'Update rankings is not implemented in development environment'},
			{status: 501},
		);
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
			await logger.debug('Proxying update rankings to backend API', {
				url: `${apiUrl}${endpoint.companies.update_rankings}`,
			});
			const response = await fetch(
				`${apiUrl}${endpoint.companies.update_rankings}`,
				{
					method: 'POST',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(reqBody),
				},
			);
			const data = await response.json();
			if (!response.ok) {
				await logger.error('Failed to update rankings via backend API', {
					status: response.status,
				});
				return NextResponse.json(
					{error: data.error || 'Failed to update rankings via backend API'},
					{status: response.status},
				);
			}
			await logger.info('Rankings updated via backend API');
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

	if (env.isProd && deployment.isPi) {
		await logger.info(
			'Environment: Production on Pi - proxying to backend API',
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
			await logger.debug('Proxying update rankings to backend API', {
				url: `${apiUrl}${endpoint.companies.update_rankings}`,
			});
			const response = await fetch(
				`${apiUrl}${endpoint.companies.update_rankings}`,
				{
					method: 'POST',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(reqBody),
				},
			);
			const data = await response.json();
			if (!response.ok) {
				await logger.error('Failed to update rankings via backend API', {
					status: response.status,
				});
				return NextResponse.json(
					{error: data.error || 'Failed to update rankings via backend API'},
					{status: response.status},
				);
			}
			await logger.info('Rankings updated via backend API');
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
