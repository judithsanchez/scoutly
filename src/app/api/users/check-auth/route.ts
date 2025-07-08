import {NextRequest, NextResponse} from 'next/server';
import {Logger} from '@/utils/logger';
import {env, deployment} from '@/config/environment';

const logger = new Logger('AuthCheckAPI');

export async function POST(req: NextRequest) {
	logger.debug('POST /api/users/check-auth called');
	try {
		const {email} = await req.json();
		logger.info('Checking auth for email', {email});

		if (env.isDev) {
			logger.debug('Environment: dev, checking user in DB');
			const {AuthService} = await import('@/services/authService');
			const user = await AuthService.findUserByEmail(email);
			if (user) {
				logger.info('User authorized (dev)', {email});
				return NextResponse.json({isAuthorized: true}, {status: 200});
			}
			logger.warn('User not found (dev)', {email});
			return NextResponse.json(
				{isAuthorized: false, message: 'User not found'},
				{status: 401},
			);
		}

		if (env.isProd && deployment.isVercel) {
			const apiUrl = require('@/config/environment').apiBaseUrl.prod;
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
			const backendUrl = `${apiUrl}/api/users/check-auth`;
			const backendRes = await fetch(backendUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
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
			logger.debug('Environment: prod-pi, checking user in DB');
			const {AuthService} = await import('@/services/authService');
			const user = await AuthService.findUserByEmail(email);
			if (user) {
				logger.info('User authorized (prod-pi)', {email});
				return NextResponse.json({isAuthorized: true}, {status: 200});
			}
			logger.warn('User not found (prod-pi)', {email});
			return NextResponse.json(
				{isAuthorized: false, message: 'User not found'},
				{status: 401},
			);
		}

		logger.warn('Unknown environment branch hit');
		return NextResponse.json(
			{isAuthorized: false, message: 'Invalid environment'},
			{status: 500},
		);
	} catch (error) {
		await logger.error('Auth check failed', {error});
		return NextResponse.json(
			{isAuthorized: false, message: 'Server error'},
			{status: 500},
		);
	}
}

export async function GET(req: NextRequest) {
	logger.debug('GET /api/users/check-auth called');
	try {
		const authCookie = req.cookies.get('auth');
		logger.info('Checking auth for cookie', {cookie: authCookie?.value});

		if (env.isDev) {
			logger.debug('Environment: dev, checking user in DB');
			const {AuthService} = await import('@/services/authService');
			const email = authCookie?.value;
			if (email) {
				const user = await AuthService.findUserByEmail(email);
				if (user) {
					logger.info('User authorized (dev)', {email});
					return NextResponse.json({isAuthorized: true});
				}
			}
			logger.warn('User not found or no cookie (dev)', {
				cookie: authCookie?.value,
			});
			return NextResponse.json({isAuthorized: false}, {status: 401});
		}

		if (env.isProd && deployment.isVercel) {
			const apiUrl = require('@/config/environment').apiBaseUrl.prod;
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
			const backendUrl = `${apiUrl}/api/users/check-auth`;
			const backendRes = await fetch(backendUrl, {
				method: 'GET',
				headers: {
					Cookie: req.headers.get('cookie') || '',
				},
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
			logger.debug('Environment: prod-pi, checking user in DB');
			const {AuthService} = await import('@/services/authService');
			const email = authCookie?.value;
			if (email) {
				const user = await AuthService.findUserByEmail(email);
				if (user) {
					logger.info('User authorized (prod-pi)', {email});
					return NextResponse.json({isAuthorized: true});
				}
			}
			logger.warn('User not found or no cookie (prod-pi)', {
				cookie: authCookie?.value,
			});
			return NextResponse.json({isAuthorized: false}, {status: 401});
		}

		logger.warn('Unknown environment branch hit');
		return NextResponse.json({isAuthorized: false}, {status: 500});
	} catch (error) {
		await logger.error('GET auth check failed', {error});
		return NextResponse.json({isAuthorized: false}, {status: 500});
	}
}
