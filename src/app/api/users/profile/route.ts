// GET /api/users/profile
import {NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {getAllowedOrigin} from '@/utils/cors';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants';
import {Logger} from '@/utils/logger';

const logger = new Logger('UsersProfileRoute');

function setCORSHeaders(res: NextResponse, req?: Request) {
	const requestOrigin = req?.headers.get('origin') || null;
	const allowedOrigin = getAllowedOrigin(requestOrigin);
	logger.debug('setCORSHeaders called', {requestOrigin, allowedOrigin});
	if (allowedOrigin) {
		res.headers.set('Access-Control-Allow-Origin', allowedOrigin);
		res.headers.set('Vary', 'Origin');
		logger.debug('Access-Control-Allow-Origin set', {allowedOrigin});
	} else {
		logger.warn('Origin not allowed, header not set', {requestOrigin});
	}
	res.headers.set('Access-Control-Allow-Credentials', 'true');
	res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
	res.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
	return res;
}

export const OPTIONS = async (req: Request) => {
	logger.debug('OPTIONS handler called for /api/users/profile');
	const res = new NextResponse(null, {status: 204});
	return setCORSHeaders(res, req);
};

export const GET = async (req: Request) => {
	logger.debug('GET handler called for /api/users/profile');
	try {
		const session = await getServerSession(authOptions);
		if (!session || !session.user?.email) {
			logger.warn('No session or user email');
			return setCORSHeaders(
				NextResponse.json({error: 'Unauthorized'}, {status: 401}),
				req,
			);
		}

		const email = session.user.email;
		logger.info('Session user email', {email});

		if (env.isDev) {
			const {AuthService} = await import('@/services/authService');
			logger.debug('Environment: dev, using AuthService');
			const user = await AuthService.findUserByEmail(email);
			if (!user) {
				logger.warn('User not found in dev', {email});
				return setCORSHeaders(
					NextResponse.json({error: 'User not found'}, {status: 404}),
					req,
				);
			}
			logger.info('Returning user profile (dev)', {email});
			return setCORSHeaders(
				NextResponse.json({
					email: user.email,
					candidateInfo: user.candidateInfo,
					cvUrl: user.cvUrl,
					preferences: user.preferences,
				}),
				req,
			);
		}

		if (env.isProd && deployment.isVercel) {
			try {
				const backendApiUrl = `${apiBaseUrl.prod}${endpoint.users.profile}`;
				logger.debug('Proxying to backend API', {backendApiUrl});
				const backendRes = await fetch(backendApiUrl, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Cookie: req.headers.get('cookie') || '',
					},
					credentials: 'include',
				});
				const data = await backendRes.json();
				logger.info('Received response from backend API', {
					status: backendRes.status,
				});
				return setCORSHeaders(
					NextResponse.json(data, {status: backendRes.status}),
					req,
				);
			} catch (error) {
				logger.error('Proxy error to backend API', error);
				return setCORSHeaders(
					NextResponse.json({error: 'Internal server error'}, {status: 500}),
					req,
				);
			}
		}

		if (env.isProd && deployment.isPi) {
			const {AuthService} = await import('@/services/authService');
			logger.debug('Environment: prod-pi, using AuthService');
			const user = await AuthService.findUserByEmail(email);
			if (!user) {
				logger.warn('User not found in prod-pi', {email});
				return setCORSHeaders(
					NextResponse.json({error: 'User not found'}, {status: 404}),
					req,
				);
			}
			logger.info('Returning user profile (prod-pi)', {email});
			return setCORSHeaders(
				NextResponse.json({
					email: user.email,
					candidateInfo: user.candidateInfo,
					cvUrl: user.cvUrl,
					preferences: user.preferences,
				}),
				req,
			);
		}

		logger.warn('Unknown environment branch hit');
		return setCORSHeaders(
			NextResponse.json({error: 'Unknown environment'}, {status: 500}),
			req,
		);
	} catch (error) {
		logger.error('Unhandled error in GET /api/users/profile', error);
		return setCORSHeaders(
			NextResponse.json({error: 'Internal server error'}, {status: 500}),
			req,
		);
	}
};
