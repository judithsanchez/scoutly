import { corsOptionsResponse } from '@/utils/cors';

export async function OPTIONS() {
  return corsOptionsResponse('user-company-preferences/[companyId]');
}
export const dynamic = 'force-dynamic';

import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants/apiEndpoints';
import {logger} from '@/utils/logger';
import {proxyToBackend} from '@/utils/proxyToBackend';
import {requireAuth} from '@/utils/requireAuth';
import {UserCompanyPreferenceUpdateSchema} from '@/schemas/userCompanyPreferenceSchemas';
import {UserCompanyPreferenceResponseSchema} from '@/schemas/userCompanyPreferenceResponseSchemas';

export async function DELETE(
	request: NextRequest,
	{params}: {params: {companyId: string}},
): Promise<Response> {
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

	const {user, response} = await requireAuth(request);
	if (!user) {
		await logger.warn(
			'[USER_COMPANY_PREFERENCES][DELETE] Unauthorized access attempt',
			{
				ip:
					request.headers.get('x-forwarded-for') || request.headers.get('host'),
			},
		);
		return response as Response;
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
		// Optionally validate response if you return the deleted object
		if (result && result.deleted) {
			const parseRes = UserCompanyPreferenceResponseSchema.safeParse(
				result.deleted,
			);
			if (!parseRes.success) {
				await logger.warn(
					'[USER_COMPANY_PREFERENCES][DELETE] Invalid response shape',
					{
						issues: parseRes.error.issues,
						user:
							user && typeof user === 'object' && 'email' in user
								? user.email
								: undefined,
					},
				);
				return NextResponse.json(
					{error: 'Invalid response shape', details: parseRes.error.issues},
					{status: 500},
				);
			}
		}
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
): Promise<Response> {
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

	const {user, response} = await requireAuth(request);
	if (!user) {
		await logger.warn(
			'[USER_COMPANY_PREFERENCES][PUT] Unauthorized access attempt',
			{
				ip:
					request.headers.get('x-forwarded-for') || request.headers.get('host'),
			},
		);
		return response as Response;
	}

	try {
		const reqBody = await request.json();
		const parseResult = UserCompanyPreferenceUpdateSchema.safeParse(reqBody);
		if (!parseResult.success) {
			await logger.warn(
				'[USER_COMPANY_PREFERENCES][PUT] Invalid request body',
				{
					issues: parseResult.error.issues,
					user:
						user && typeof user === 'object' && 'email' in user
							? user.email
							: undefined,
				},
			);
			return NextResponse.json(
				{error: 'Invalid request body', details: parseResult.error.issues},
				{status: 400},
			);
		}
		const {UserCompanyPreferenceService} = await import(
			'@/services/userCompanyPreferenceService'
		);
		const result = await UserCompanyPreferenceService.updateByCompanyId(
			params.companyId,
			parseResult.data,
		);
		// Optionally validate response if you return the updated object
		if (result && result.updated) {
			const parseRes = UserCompanyPreferenceResponseSchema.safeParse(
				result.updated,
			);
			if (!parseRes.success) {
				await logger.warn(
					'[USER_COMPANY_PREFERENCES][PUT] Invalid response shape',
					{
						issues: parseRes.error.issues,
						user:
							user && typeof user === 'object' && 'email' in user
								? user.email
								: undefined,
					},
				);
				return NextResponse.json(
					{error: 'Invalid response shape', details: parseRes.error.issues},
					{status: 500},
				);
			}
		}
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
