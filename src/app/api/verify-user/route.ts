import {NextResponse} from 'next/server';
import {
	env,
	deployment,
	apiBaseUrl,
	secret,
	header,
} from '@/config/environment';
import {UserService} from '@/services/userService';
import {Logger} from '@/utils/logger';

const logger = new Logger('api/verify-user');

export async function POST(request: Request) {
	await logger.debug('POST /verify-user called');
	try {
		const {email} = await request.json();
		await logger.debug('Parsed request body', {email});
		if (!email) {
			await logger.warn('Missing email in request body');
			return NextResponse.json({message: 'Missing email'}, {status: 400});
		}

		// Development: query DB directly
		if (env.isDev) {
			await logger.info('Environment: Development - querying DB directly');
			try {
				const dbUser = await UserService.getUserByEmail(email);
				await logger.debug('DB user lookup result', {exists: !!dbUser});
				return NextResponse.json({exists: !!dbUser});
			} catch (err) {
				await logger.error('verify-user error (dev)', err);
				return NextResponse.json(
					{message: 'Internal server error'},
					{status: 500},
				);
			}
		}

		// Production on Vercel: proxy to backend API
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
				await logger.debug('Proxying to backend API', {
					url: `${apiUrl}/verify-user`,
					email,
				});
				const backendRes = await fetch(`${apiUrl}/verify-user`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({email}),
				});
				const data = await backendRes.json();
				await logger.debug('Response from backend API', {
					status: backendRes.status,
					data,
				});
				return NextResponse.json(data, {status: backendRes.status});
			} catch (err) {
				await logger.error('Error proxying to backend API', err);
				return NextResponse.json(
					{error: 'Error connecting to backend API'},
					{status: 500},
				);
			}
		}

		// Production on Pi: query DB directly
		if (env.isProd && deployment.isPi) {
			await logger.info('Environment: Production on Pi - querying DB directly');
			try {
				const dbUser = await UserService.getUserByEmail(email);
				await logger.debug('DB user lookup result (prod/pi)', {
					exists: !!dbUser,
				});
				return NextResponse.json({exists: !!dbUser});
			} catch (err) {
				await logger.error('verify-user error (prod/pi)', err);
				return NextResponse.json(
					{message: 'Internal server error'},
					{status: 500},
				);
			}
		}

		await logger.warn('Unknown environment, cannot process request');
		return NextResponse.json({message: 'Unknown environment'}, {status: 500});
	} catch (err) {
		await logger.error('verify-user error (outer catch)', err);
		return NextResponse.json({message: 'Internal server error'}, {status: 500});
	}
}
