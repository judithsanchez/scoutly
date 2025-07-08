import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants';
import {logger} from '@/utils/logger';

let UserService: any;
try {
	UserService = require('@/services/userService').UserService;
} catch {}

// PATCH /api/users/promote
export async function PATCH(request: NextRequest) {
	await logger.debug(`PATCH ${endpoint.admin.promote_user} called`, {
		env: {...env},
		deployment: {...deployment},
	});

	const reqBody = await request.json();
	const secret = request.headers.get('x-internal-api-secret');

	if (env.isDev || (env.isProd && deployment.isPi)) {
		if (!UserService) {
			await logger.error('UserService not implemented');
			return NextResponse.json(
				{error: 'UserService not implemented'},
				{status: 501},
			);
		}
		try {
			const result = await UserService.promoteUser(reqBody, secret);
			return NextResponse.json(result);
		} catch (error) {
			await logger.error('Error promoting user', error);
			return NextResponse.json(
				{
					error: 'Error promoting user',
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
			await logger.debug('Proxying promote user to backend API', {
				url: `${apiUrl}${endpoint.admin.promote_user}`,
			});
			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
			};
			if (secret) headers['x-internal-api-secret'] = secret;
			const response = await fetch(`${apiUrl}${endpoint.admin.promote_user}`, {
				method: 'PATCH',
				headers,
				body: JSON.stringify(reqBody),
			});
			const data = await response.json();
			if (!response.ok) {
				await logger.error('Failed to promote user via backend API', {
					status: response.status,
				});
				return NextResponse.json(
					{error: data.error || 'Failed to promote user via backend API'},
					{status: response.status},
				);
			}
			await logger.info('User promoted via backend API');
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
