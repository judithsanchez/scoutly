import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants';
import {logger} from '@/utils/logger';

let AuthService: any;
try {
	AuthService = require('@/services/authService').AuthService;
} catch {}

export async function POST(req: NextRequest) {
	await logger.debug(`POST ${endpoint.users.check_auth} called`, {
		env: {...env},
		deployment: {...deployment},
	});
	try {
		const {email} = await req.json();
		await logger.info('Checking auth for email', {email});

		if (env.isDev || (env.isProd && deployment.isPi)) {
			if (!AuthService) {
				await logger.error('AuthService not implemented');
				return NextResponse.json(
					{error: 'AuthService not implemented'},
					{status: 501},
				);
			}
			const user = await AuthService.findUserByEmail(email);
			if (user) {
				await logger.info('User authorized', {email});
				return NextResponse.json({isAuthorized: true}, {status: 200});
			}
			await logger.warn('User not found', {email});
			return NextResponse.json(
				{isAuthorized: false, message: 'User not found'},
				{status: 401},
			);
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
			const backendUrl = `${apiUrl}${endpoint.users.check_auth}`;
			const backendRes = await fetch(backendUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({email}),
			});
			const data = await backendRes.json();
			await logger.info('Received response from backend API', {
				status: backendRes.status,
			});
			if (!backendRes.ok) {
				await logger.error('Backend error', {status: backendRes.status, data});
				return NextResponse.json(
					{error: data.error || 'Backend error'},
					{status: backendRes.status},
				);
			}
			return NextResponse.json(data);
		}

		await logger.warn('Unknown environment branch hit');
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
	await logger.debug(`GET ${endpoint.users.check_auth} called`, {
		env: {...env},
		deployment: {...deployment},
	});
	try {
		const authCookie = req.cookies.get('auth');
		await logger.info('Checking auth for cookie', {cookie: authCookie?.value});

		if (env.isDev || (env.isProd && deployment.isPi)) {
			if (!AuthService) {
				await logger.error('AuthService not implemented');
				return NextResponse.json(
					{error: 'AuthService not implemented'},
					{status: 501},
				);
			}
			const email = authCookie?.value;
			if (email) {
				const user = await AuthService.findUserByEmail(email);
				if (user) {
					await logger.info('User authorized', {email});
					return NextResponse.json({isAuthorized: true});
				}
			}
			await logger.warn('User not found or no cookie', {
				cookie: authCookie?.value,
			});
			return NextResponse.json({isAuthorized: false}, {status: 401});
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
			const backendUrl = `${apiUrl}${endpoint.users.check_auth}`;
			const backendRes = await fetch(backendUrl, {
				method: 'GET',
				headers: {
					Cookie: req.headers.get('cookie') || '',
				},
			});
			const data = await backendRes.json();
			await logger.info('Received response from backend API', {
				status: backendRes.status,
			});
			if (!backendRes.ok) {
				await logger.error('Backend error', {status: backendRes.status, data});
				return NextResponse.json(
					{error: data.error || 'Backend error'},
					{status: backendRes.status},
				);
			}
			return NextResponse.json(data);
		}

		await logger.warn('Unknown environment branch hit');
		return NextResponse.json({isAuthorized: false}, {status: 500});
	} catch (error) {
		await logger.error('GET auth check failed', {error});
		return NextResponse.json({isAuthorized: false}, {status: 500});
	}
}
