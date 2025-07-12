export const dynamic = 'force-dynamic';

import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants/apiEndpoints';
import {logger} from '@/utils/logger';
import {proxyToBackend} from '@/utils/proxyToBackend';

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

	if (deployment.isVercel && env.isProd) {
		const url = `${
			apiBaseUrl.prod
		}${endpoint.user_company_preferences.by_company_id.replace(
			'[companyId]',
			params.companyId,
		)}`;
		return proxyToBackend({
			request,
			backendUrl: url,
			methodOverride: 'DELETE',
			logPrefix: '[USER_COMPANY_PREFERENCES][DELETE][PROXY]',
		});
	}

	try {
		const reqBody = await request.json();
		const {UserCompanyPreferenceService} = await import(
			'@/services/userCompanyPreferenceService'
		);
		const result = await UserCompanyPreferenceService.deleteByCompanyId(
			params.companyId,
			reqBody,
		);
		return NextResponse.json(result);
	} catch (error) {
		await logger.error(
			'Error deleting user-company-preferences by companyId',
			error,
		);
		return NextResponse.json(
			{
				error: 'Error deleting user-company-preferences by companyId',
				details: (error as Error).message,
			},
			{status: 500},
		);
	}
}

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

	if (deployment.isVercel && env.isProd) {
		const url = `${
			apiBaseUrl.prod
		}${endpoint.user_company_preferences.by_company_id.replace(
			'[companyId]',
			params.companyId,
		)}`;
		return proxyToBackend({
			request,
			backendUrl: url,
			methodOverride: 'PUT',
			logPrefix: '[USER_COMPANY_PREFERENCES][PUT][PROXY]',
		});
	}

	try {
		const reqBody = await request.json();
		const {UserCompanyPreferenceService} = await import(
			'@/services/userCompanyPreferenceService'
		);
		const result = await UserCompanyPreferenceService.updateByCompanyId(
			params.companyId,
			reqBody,
		);
		return NextResponse.json(result);
	} catch (error) {
		await logger.error(
			'Error updating user-company-preferences by companyId',
			error,
		);
		return NextResponse.json(
			{
				error: 'Error updating user-company-preferences by companyId',
				details: (error as Error).message,
			},
			{status: 500},
		);
	}
}
