export const dynamic = 'force-dynamic';

import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants';
import {logger} from '@/utils/logger';

// GET /api/user-company-preferences
export async function GET(request: NextRequest) {
	await logger.debug(`GET ${endpoint.user_company_preferences.list} called`, {
		env: {...env},
		deployment: {...deployment},
	});

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
			const url =
				`${apiUrl}${endpoint.user_company_preferences.list}` +
				(request.url.includes('?')
					? request.url.substring(request.url.indexOf('?'))
					: '');
			await logger.debug(
				'Proxying get user-company-preferences to backend API',
				{url},
			);
			const response = await fetch(url, {
				method: 'GET',
				headers: {'Content-Type': 'application/json'},
			});
			const data = await response.json();
			if (!response.ok) {
				await logger.error(
					'Failed to fetch user-company-preferences via backend API',
					{
						status: response.status,
					},
				);
				return NextResponse.json(
					{
						error:
							data.error ||
							'Failed to fetch user-company-preferences via backend API',
					},
					{status: response.status},
				);
			}
			await logger.info('User-company-preferences fetched via backend API');
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

	await logger.warn(
		'Direct DB access for user-company-preferences is not implemented',
	);
	return NextResponse.json(
		{error: 'Direct DB access for user-company-preferences is not implemented'},
		{status: 501},
	);
}

// POST /api/user-company-preferences
export async function POST(request: NextRequest) {
	await logger.debug(`POST ${endpoint.user_company_preferences.list} called`, {
		env: {...env},
		deployment: {...deployment},
	});

	const reqBody = await request.json();

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
			await logger.debug(
				'Proxying post user-company-preferences to backend API',
				{
					url: `${apiUrl}${endpoint.user_company_preferences.list}`,
				},
			);
			const response = await fetch(
				`${apiUrl}${endpoint.user_company_preferences.list}`,
				{
					method: 'POST',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(reqBody),
				},
			);
			const data = await response.json();
			if (!response.ok) {
				await logger.error(
					'Failed to create user-company-preferences via backend API',
					{
						status: response.status,
					},
				);
				return NextResponse.json(
					{
						error:
							data.error ||
							'Failed to create user-company-preferences via backend API',
					},
					{status: response.status},
				);
			}
			await logger.info('User-company-preferences created via backend API');
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

	await logger.warn(
		'Direct DB access for user-company-preferences is not implemented',
	);
	return NextResponse.json(
		{error: 'Direct DB access for user-company-preferences is not implemented'},
		{status: 501},
	);
}

// PATCH /api/user-company-preferences
export async function PATCH(request: NextRequest) {
	await logger.debug(`PATCH ${endpoint.user_company_preferences.list} called`, {
		env: {...env},
		deployment: {...deployment},
	});

	const reqBody = await request.json();

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
			await logger.debug(
				'Proxying patch user-company-preferences to backend API',
				{
					url: `${apiUrl}${endpoint.user_company_preferences.list}`,
				},
			);
			const response = await fetch(
				`${apiUrl}${endpoint.user_company_preferences.list}`,
				{
					method: 'PATCH',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(reqBody),
				},
			);
			const data = await response.json();
			if (!response.ok) {
				await logger.error(
					'Failed to patch user-company-preferences via backend API',
					{
						status: response.status,
					},
				);
				return NextResponse.json(
					{
						error:
							data.error ||
							'Failed to patch user-company-preferences via backend API',
					},
					{status: response.status},
				);
			}
			await logger.info('User-company-preferences patched via backend API');
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

	await logger.warn(
		'Direct DB access for user-company-preferences is not implemented',
	);
	return NextResponse.json(
		{error: 'Direct DB access for user-company-preferences is not implemented'},
		{status: 501},
	);
}

// DELETE /api/user-company-preferences
export async function DELETE(request: NextRequest) {
	await logger.debug(
		`DELETE ${endpoint.user_company_preferences.list} called`,
		{
			env: {...env},
			deployment: {...deployment},
		},
	);

	const reqBody = await request.json();

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
			await logger.debug(
				'Proxying delete user-company-preferences to backend API',
				{
					url: `${apiUrl}${endpoint.user_company_preferences.list}`,
				},
			);
			const response = await fetch(
				`${apiUrl}${endpoint.user_company_preferences.list}`,
				{
					method: 'DELETE',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(reqBody),
				},
			);
			const data = await response.json();
			if (!response.ok) {
				await logger.error(
					'Failed to delete user-company-preferences via backend API',
					{
						status: response.status,
					},
				);
				return NextResponse.json(
					{
						error:
							data.error ||
							'Failed to delete user-company-preferences via backend API',
					},
					{status: response.status},
				);
			}
			await logger.info('User-company-preferences deleted via backend API');
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

	await logger.warn(
		'Direct DB access for user-company-preferences is not implemented',
	);
	return NextResponse.json(
		{error: 'Direct DB access for user-company-preferences is not implemented'},
		{status: 501},
	);
}
