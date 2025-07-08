export const dynamic = 'force-dynamic';

import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants';
import {CompanyService} from '@/services/companyService';
import {logger} from '@/utils/logger';

// PATCH: Update company details (admin only)
export async function PATCH(
	request: NextRequest,
	{params}: {params: {companyId: string}},
) {
	await logger.debug(
		`PATCH ${endpoint.companies.list}/${params.companyId} called`,
		{
			env: {...env},
			deployment: {...deployment},
			companyId: params.companyId,
		},
	);

	const reqBody = await request.json();

	if (env.isDev) {
		await logger.info('Environment: Development - updating company directly');
		try {
			const updated = await CompanyService.updateCompany(
				params.companyId,
				reqBody,
			);
			return NextResponse.json(updated);
		} catch (error) {
			await logger.error('Error updating company (dev)', error);
			return NextResponse.json(
				{
					error: 'Error updating company',
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
			await logger.debug('Proxying update company to backend API', {
				url: `${apiUrl}${endpoint.companies.list}/${params.companyId}`,
			});
			const response = await fetch(
				`${apiUrl}${endpoint.companies.list}/${params.companyId}`,
				{
					method: 'PATCH',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(reqBody),
				},
			);
			const data = await response.json();
			if (!response.ok) {
				await logger.error('Failed to update company via backend API', {
					status: response.status,
				});
				return NextResponse.json(
					{error: data.error || 'Failed to update company via backend API'},
					{status: response.status},
				);
			}
			await logger.info('Company updated via backend API');
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
			'Environment: Production on Pi - updating company directly',
		);
		try {
			const updated = await CompanyService.updateCompany(
				params.companyId,
				reqBody,
			);
			return NextResponse.json(updated);
		} catch (error) {
			await logger.error('Error updating company (prod/pi)', error);
			return NextResponse.json(
				{
					error: 'Error updating company',
					details: (error as Error).message,
				},
				{status: 500},
			);
		}
	}
}

// DELETE: Remove company (admin only)
export async function DELETE(
	request: NextRequest,
	{params}: {params: {companyId: string}},
) {
	await logger.debug(
		`DELETE ${endpoint.companies.list}/${params.companyId} called`,
		{
			env: {...env},
			deployment: {...deployment},
			companyId: params.companyId,
		},
	);

	if (env.isDev) {
		await logger.info('Environment: Development - deleting company directly');
		try {
			const deleted = await CompanyService.deleteCompany(params.companyId);
			return NextResponse.json(deleted);
		} catch (error) {
			await logger.error('Error deleting company (dev)', error);
			return NextResponse.json(
				{
					error: 'Error deleting company',
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
			await logger.debug('Proxying delete company to backend API', {
				url: `${apiUrl}${endpoint.companies.list}/${params.companyId}`,
			});
			const response = await fetch(
				`${apiUrl}${endpoint.companies.list}/${params.companyId}`,
				{
					method: 'DELETE',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(await request.json()),
				},
			);
			const data = await response.json();
			if (!response.ok) {
				await logger.error('Failed to delete company via backend API', {
					status: response.status,
				});
				return NextResponse.json(
					{error: data.error || 'Failed to delete company via backend API'},
					{status: response.status},
				);
			}
			await logger.info('Company deleted via backend API');
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
			'Environment: Production on Pi - deleting company directly',
		);
		try {
			const deleted = await CompanyService.deleteCompany(params.companyId);
			return NextResponse.json(deleted);
		} catch (error) {
			await logger.error('Error deleting company (prod/pi)', error);
			return NextResponse.json(
				{
					error: 'Error deleting company',
					details: (error as Error).message,
				},
				{status: 500},
			);
		}
	}
}
