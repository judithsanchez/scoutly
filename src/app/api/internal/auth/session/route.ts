import {NextResponse} from 'next/server';
import {
	env,
	deployment,
	apiBaseUrl,
	secret,
	header,
} from '@/config/environment';
import {endpoint} from '@/constants';
import {Logger} from '@/utils/logger';

const logger = new Logger('InternalAuthSessionRoute');

export async function GET(req: Request) {
	logger.debug('GET /api/internal/auth/session called');
	const apiSecret = req.headers.get(header.internalApiSecret);
	if (apiSecret !== secret.internalApiSecret) {
		logger.warn('Unauthorized: invalid internal API secret');
		return NextResponse.json({error: 'Unauthorized'}, {status: 401});
	}

	try {
		if (env.isDev) {
			logger.debug('Environment: dev, using AuthService');
			const {AuthService} = await import('@/services/authService');
			const email = (req.headers.get('x-dev-email') || '').toLowerCase();
			let session = null;
			if (email) {
				session = await AuthService.getUserSessionInfo(email);
				logger.info('Session info fetched (dev)', {email, session});
			} else {
				logger.warn('No x-dev-email header provided');
			}
			return NextResponse.json({
				session: session || {mock: true},
				env: 'dev',
				isDev: env.isDev,
				isProd: env.isProd,
				isVercel: deployment.isVercel,
				isPi: deployment.isPi,
				flags: {...env, ...deployment},
			});
		}

		if (env.isProd && deployment.isVercel) {
			const apiUrl = apiBaseUrl.prod;
			logger.debug('Environment: prod-vercel, proxying to backend API', {
				apiUrl,
			});
			if (!apiUrl) {
				logger.error('Backend API URL not configured');
				return NextResponse.json(
					{error: 'Backend API URL not configured'},
					{status: 500},
				);
			}
			const backendUrl = `${apiBaseUrl.prod}${endpoint.auth.session}${
				req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''
			}`;
			logger.debug('Proxying to backendUrl', {backendUrl});
			const backendRes = await fetch(backendUrl, {
				method: 'GET',
				headers: new Headers({
					[header.internalApiSecret]: secret.internalApiSecret ?? '',
				}),
			});
			const data = await backendRes.json();
			logger.info('Received response from backend API', {
				status: backendRes.status,
			});
			if (!backendRes.ok) {
				logger.error('Backend error', {status: backendRes.status, data});
				return NextResponse.json(
					{error: data.error || 'Backend error'},
					{status: backendRes.status},
				);
			}
			return NextResponse.json({
				...data,
				env: 'prod-vercel',
				isDev: env.isDev,
				isProd: env.isProd,
				isVercel: deployment.isVercel,
				isPi: deployment.isPi,
				flags: {...env, ...deployment},
			});
		}

		if (env.isProd && deployment.isPi) {
			logger.debug('Environment: prod-pi, using AuthService');
			const {AuthService} = await import('@/services/authService');
			const cookie = req.headers.get('cookie') || '';
			const sessionToken = cookie
				.split(';')
				.map(c => c.trim())
				.find(c => c.startsWith('__Secure-next-auth.session-token='))
				?.split('=')[1];
			let session = null;
			if (sessionToken) {
				session = await AuthService.getUserSessionInfo(sessionToken);
				logger.info('Session info fetched (prod-pi)', {sessionToken, session});
			} else {
				logger.warn('No session token found in cookie');
			}
			return NextResponse.json({
				session: session || {mock: true},
				env: 'prod-pi',
				isDev: env.isDev,
				isProd: env.isProd,
				isVercel: deployment.isVercel,
				isPi: deployment.isPi,
				flags: {...env, ...deployment},
			});
		}

		logger.warn('Unknown environment branch hit');
		return NextResponse.json({error: 'Unknown environment'}, {status: 500});
	} catch (error: any) {
		logger.error('Unhandled error in GET /api/internal/auth/session', error);
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}
