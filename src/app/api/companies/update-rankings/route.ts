export const dynamic = 'force-dynamic';

import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants/apiEndpoints';
import {logger} from '@/utils/logger';
import {requireAuth} from '@/utils/requireAuth';
import {proxyToBackend} from '@/utils/proxyToBackend';
import {getUserEmail} from '@/utils/typeHelpers';

export async function POST(request: NextRequest): Promise<Response> {
	if (deployment.isVercel && env.isProd) {
		const apiUrlFull = `${apiBaseUrl.prod}${endpoint.companies.update_rankings}`;
		return proxyToBackend({
			request,
			backendUrl: apiUrlFull,
			methodOverride: 'POST',
			logPrefix: '[COMPANIES][UPDATE-RANKINGS][PROXY]',
		});
	}

	await logger.debug(
		`[COMPANIES][UPDATE-RANKINGS][POST] ${endpoint.companies.update_rankings} called`,
		{
			env: {...env},
			deployment: {...deployment},
			headers: Object.fromEntries(request.headers.entries()),
		},
	);

	const {user, response} = await requireAuth(request);
	const userEmail = getUserEmail(user);
	if (!user) {
		await logger.warn(
			'[COMPANIES][UPDATE-RANKINGS][POST] Unauthorized access attempt',
			{
				ip:
					request.headers.get('x-forwarded-for') || request.headers.get('host'),
			},
		);
		return response as Response;
	}

	try {
		const reqBody = await request.json();

		await logger.info(
			'[COMPANIES][UPDATE-RANKINGS][POST] Rankings update attempted',
			{
				user: userEmail,
				payload: reqBody,
			},
		);

		await logger.warn(
			'[COMPANIES][UPDATE-RANKINGS][POST] Update rankings is not implemented for this environment',
			{
				user: userEmail,
			},
		);
		return NextResponse.json(
			{error: 'Update rankings is not implemented in this environment'},
			{status: 501},
		);
	} catch (error) {
		await logger.error(
			'[COMPANIES][UPDATE-RANKINGS][POST] Error updating rankings',
			{
				error,
				user: userEmail,
			},
		);
		return NextResponse.json(
			{
				error: 'Error updating rankings',
				details: (error as Error).message,
			},
			{status: 500},
		);
	}
}
