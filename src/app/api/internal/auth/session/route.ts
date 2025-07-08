import {NextResponse} from 'next/server';
import {
	env,
	deployment,
	apiBaseUrl,
	secret,
	header,
} from '@/config/environment';
import {endpoint} from '@/constants';

export async function GET(req: Request) {
	const apiSecret = req.headers.get(header.internalApiSecret);
	if (apiSecret !== secret.internalApiSecret) {
		return NextResponse.json({error: 'Unauthorized'}, {status: 401});
	}

	try {
		if (env.isDev) {
			// Use AuthService to get session info for dev
			const {AuthService} = await import('@/services/authService');
			const email = (req.headers.get('x-dev-email') || '').toLowerCase();
			let session = null;
			if (email) {
				session = await AuthService.getUserSessionInfo(email);
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
			if (!apiUrl) {
				return NextResponse.json(
					{error: 'Backend API URL not configured'},
					{status: 500},
				);
			}
			const backendUrl = `${apiBaseUrl.prod}${endpoint.auth.session}${
				req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''
			}`;
			const backendRes = await fetch(backendUrl, {
				method: 'GET',
				headers: new Headers({
					[header.internalApiSecret]: secret.internalApiSecret ?? '',
				}),
			});
			const data = await backendRes.json();
			if (!backendRes.ok) {
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
			// Use AuthService to get session info for Pi (extract email from cookie or header)
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

		return NextResponse.json({error: 'Unknown environment'}, {status: 500});
	} catch (error: any) {
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}
