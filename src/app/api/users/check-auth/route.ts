import {NextRequest, NextResponse} from 'next/server';
import {Logger} from '@/utils/logger';
import {env, deployment} from '@/config/environment';

const logger = new Logger('AuthCheckAPI');

export async function POST(req: NextRequest) {
	try {
		const {email} = await req.json();

		if (env.isDev) {
			// In dev, authorize any user that exists in the DB
			const {AuthService} = await import('@/services/authService');
			const user = await AuthService.findUserByEmail(email);
			if (user) {
				return NextResponse.json({isAuthorized: true}, {status: 200});
			}
			return NextResponse.json(
				{isAuthorized: false, message: 'User not found'},
				{status: 401},
			);
		}

		if (env.isProd && deployment.isVercel) {
			// Proxy to backend API
			const apiUrl = require('@/config/environment').apiBaseUrl.prod;
			if (!apiUrl) {
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
			if (!backendRes.ok) {
				return NextResponse.json(
					{error: data.error || 'Backend error'},
					{status: backendRes.status},
				);
			}
			return NextResponse.json(data);
		}

		if (env.isProd && deployment.isPi) {
			// In prod Pi, authorize if user exists in DB
			const {AuthService} = await import('@/services/authService');
			const user = await AuthService.findUserByEmail(email);
			if (user) {
				return NextResponse.json({isAuthorized: true}, {status: 200});
			}
			return NextResponse.json(
				{isAuthorized: false, message: 'User not found'},
				{status: 401},
			);
		}

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
	try {
		const authCookie = req.cookies.get('auth');

		if (env.isDev) {
			// In dev, authorize if cookie is set and user exists
			const {AuthService} = await import('@/services/authService');
			const email = authCookie?.value;
			if (email) {
				const user = await AuthService.findUserByEmail(email);
				if (user) {
					return NextResponse.json({isAuthorized: true});
				}
			}
			return NextResponse.json({isAuthorized: false}, {status: 401});
		}

		if (env.isProd && deployment.isVercel) {
			// Proxy to backend API
			const apiUrl = require('@/config/environment').apiBaseUrl.prod;
			if (!apiUrl) {
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
			if (!backendRes.ok) {
				return NextResponse.json(
					{error: data.error || 'Backend error'},
					{status: backendRes.status},
				);
			}
			return NextResponse.json(data);
		}

		if (env.isProd && deployment.isPi) {
			// In prod Pi, authorize if cookie is set and user exists
			const {AuthService} = await import('@/services/authService');
			const email = authCookie?.value;
			if (email) {
				const user = await AuthService.findUserByEmail(email);
				if (user) {
					return NextResponse.json({isAuthorized: true});
				}
			}
			return NextResponse.json({isAuthorized: false}, {status: 401});
		}

		return NextResponse.json({isAuthorized: false}, {status: 500});
	} catch (error) {
		await logger.error('GET auth check failed', {error});
		return NextResponse.json({isAuthorized: false}, {status: 500});
	}
}
