export const dynamic = 'force-dynamic';

import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants';
import {logger} from '@/utils/logger';

// DELETE /api/user-company-preferences/[companyId]
export async function DELETE(
	request: NextRequest,
	{params}: {params: {companyId: string}},
) {
	await logger.debug(
		`DELETE ${endpoint.user_company_preferences.by_company_id.replace(
			'[companyId]',
			params.companyId,
		)} called`,
		{
			env: {...env},
			deployment: {...deployment},
			companyId: params.companyId,
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
			const url = `${apiUrl}${endpoint.user_company_preferences.by_company_id.replace(
				'[companyId]',
				params.companyId,
			)}`;
			await logger.debug(
				'Proxying delete user-company-preferences by companyId to backend API',
				{url},
			);
			const response = await fetch(url, {
				method: 'DELETE',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify(reqBody),
			});
			const data = await response.json();
			if (!response.ok) {
				await logger.error(
					'Failed to delete user-company-preferences by companyId via backend API',
					{
						status: response.status,
					},
				);
				return NextResponse.json(
					{
						error:
							data.error ||
							'Failed to delete user-company-preferences by companyId via backend API',
					},
					{status: response.status},
				);
			}
			await logger.info(
				'User-company-preferences by companyId deleted via backend API',
			);
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
		'Direct DB access for user-company-preferences by companyId is not implemented',
	);
	return NextResponse.json(
		{
			error:
				'Direct DB access for user-company-preferences by companyId is not implemented',
		},
		{status: 501},
	);
}

// PUT /api/user-company-preferences/[companyId]
export async function PUT(
	request: NextRequest,
	{params}: {params: {companyId: string}},
) {
	await logger.debug(
		`PUT ${endpoint.user_company_preferences.by_company_id.replace(
			'[companyId]',
			params.companyId,
		)} called`,
		{
			env: {...env},
			deployment: {...deployment},
			companyId: params.companyId,
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
			const url = `${apiUrl}${endpoint.user_company_preferences.by_company_id.replace(
				'[companyId]',
				params.companyId,
			)}`;
			await logger.debug(
				'Proxying put user-company-preferences by companyId to backend API',
				{url},
			);
			const response = await fetch(url, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify(reqBody),
			});
			const data = await response.json();
			if (!response.ok) {
				await logger.error(
					'Failed to update user-company-preferences by companyId via backend API',
					{
						status: response.status,
					},
				);
				return NextResponse.json(
					{
						error:
							data.error ||
							'Failed to update user-company-preferences by companyId via backend API',
					},
					{status: response.status},
				);
			}
			await logger.info(
				'User-company-preferences by companyId updated via backend API',
			);
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
		'Direct DB access for user-company-preferences by companyId is not implemented',
	);
	return NextResponse.json(
		{
			error:
				'Direct DB access for user-company-preferences by companyId is not implemented',
		},
		{status: 501},
	);
}
