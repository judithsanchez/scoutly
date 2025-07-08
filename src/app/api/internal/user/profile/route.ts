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

const logger = new Logger('InternalUserProfileRoute');

export const POST = async (req: Request) => {
	logger.debug('POST /api/internal/user/profile called');
	const apiSecret = req.headers.get(header.internalApiSecret);
	if (apiSecret !== secret.internalApiSecret) {
		logger.warn('Forbidden: invalid internal API secret');
		return NextResponse.json({error: 'Forbidden'}, {status: 403});
	}

	try {
		const {email} = await req.json();
		logger.info('Profile lookup for email', {email});
		if (!email) {
			logger.warn('No email provided');
			return NextResponse.json({error: 'Email required'}, {status: 400});
		}

		if (env.isDev) {
			logger.debug('Environment: dev, using AuthService');
			const {AuthService} = await import('@/services/authService');
			const user = await AuthService.findUserByEmail(email);
			if (!user) {
				logger.warn('User not found (dev)', {email});
				return NextResponse.json({error: 'User not found'}, {status: 404});
			}
			logger.info('Returning user profile (dev)', {email});
			return NextResponse.json({
				email: user.email,
				candidateInfo: user.candidateInfo,
				cvUrl: user.cvUrl,
				preferences: user.preferences,
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
			const backendUrl = `${apiBaseUrl.prod}${endpoint.auth.profile}`;
			logger.debug('Proxying to backendUrl', {backendUrl});
			const backendRes = await fetch(backendUrl, {
				method: 'POST',
				headers: new Headers({
					[header.internalApiSecret]: secret.internalApiSecret ?? '',
					'Content-Type': 'application/json',
				}),
				body: JSON.stringify({email}),
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
			return NextResponse.json(data);
		}

		if (env.isProd && deployment.isPi) {
			logger.debug('Environment: prod-pi, using AuthService');
			const {AuthService} = await import('@/services/authService');
			const user = await AuthService.findUserByEmail(email);
			if (!user) {
				logger.warn('User not found (prod-pi)', {email});
				return NextResponse.json({error: 'User not found'}, {status: 404});
			}
			logger.info('Returning user profile (prod-pi)', {email});
			return NextResponse.json({
				email: user.email,
				candidateInfo: user.candidateInfo,
				cvUrl: user.cvUrl,
				preferences: user.preferences,
			});
		}

		logger.warn('Unknown environment branch hit');
		return NextResponse.json({error: 'Unknown environment'}, {status: 500});
	} catch (error: any) {
		logger.error('Unhandled error in POST /api/internal/user/profile', error);
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
};
