import {NextResponse} from 'next/server';
import {
	env,
	deployment,
	apiBaseUrl,
	header,
	secret,
} from '@/config/environment';
import {logger} from '@/utils/logger';
import {endpoint} from '@/constants';
export async function POST(req: Request) {
	await logger.debug(`POST ${endpoint.auth.signin} called`);

	try {
		const {email} = await req.json();
		if (!email) {
			await logger.warn('No email provided');
			return NextResponse.json(
				{approved: false, message: 'No email provided'},
				{status: 400},
			);
		}

		if (env.isDev) {
			await logger.info('Development: checking/creating user in DB', {email});
			// Use AuthService to auto-create user if not exists (dev only)
			const {AuthService} = await import('@/services/authService');
			await AuthService.createUserIfNotExists(email, {
				candidateInfo: {name: email, email},
				cvUrl: 'dev-mock-cv-url',
				preferences: {
					jobTypes: [],
					locations: [],
					salaryRange: {min: 0, max: 200000},
				},
			});
			return NextResponse.json({
				approved: true,
				message: 'Dev auto-approve',
			});
		}

		if (env.isProd && deployment.isVercel) {
			await logger.info('Production on Vercel: proxying to backend API', {
				email,
			});
			const apiUrl = apiBaseUrl.prod;
			if (!apiUrl) {
				await logger.error('Backend API URL not configured');
				return NextResponse.json(
					{error: 'Backend API URL not configured'},
					{status: 500},
				);
			}
			const backendUrl = `${apiBaseUrl.prod}${endpoint.auth.signin}`;
			const backendRes = await fetch(backendUrl, {
				method: 'POST',
				headers: new Headers({
					[header.internalApiSecret]: secret.internalApiSecret ?? '',
				}),
				body: JSON.stringify({email}),
			});
			const data = await backendRes.json();
			if (!backendRes.ok) {
				await logger.error('Backend error', {status: backendRes.status, data});
				return NextResponse.json(
					{error: data.error || 'Backend error'},
					{status: backendRes.status},
				);
			}
			await logger.info('Sign-in approval result from backend', data);
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
			await logger.info('Production on Pi: checking approval and user in DB', {
				email,
			});
			const {AuthService} = await import('@/services/authService');
			// Allow any user that exists in the DB (remove domain restriction)
			const user = await AuthService.findUserByEmail(email);
			const approved = !!user;
			return NextResponse.json({
				approved,
				message: approved
					? 'Pi approval: user exists'
					: 'Pi approval: denied (user missing)',
				env: 'prod-pi',
				isDev: env.isDev,
				isProd: env.isProd,
				isVercel: deployment.isVercel,
				isPi: deployment.isPi,
				flags: {...env, ...deployment},
			});
		}

		await logger.warn('Unknown environment, denying sign-in');
		return NextResponse.json(
			{approved: false, message: 'Unknown environment'},
			{status: 500},
		);
	} catch (error: any) {
		await logger.error('Internal server error', error);
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}
