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
		await logger.info('[DEBUG] Incoming sign-in request', {
			email,
			env,
			deployment,
		});

		if (!email) {
			await logger.warn('[DEBUG] No email provided');
			return NextResponse.json(
				{approved: false, message: 'No email provided'},
				{status: 400},
			);
		}

		if (env.isDev) {
			await logger.info('[DEBUG] Development: checking/creating user in DB', {
				email,
			});
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
			await logger.info('[DEBUG] Dev auto-approve', {email});
			return NextResponse.json({
				approved: true,
				message: 'Dev auto-approve',
			});
		}

		if (env.isProd && deployment.isVercel) {
			await logger.info(
				'[DEBUG] Production on Vercel: proxying to backend API',
				{
					email,
				},
			);
			const apiUrl = apiBaseUrl.prod;
			if (!apiUrl) {
				await logger.error('[DEBUG] Backend API URL not configured');
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
			await logger.info('[DEBUG] Response from backend', {
				status: backendRes.status,
				data,
			});
			if (!backendRes.ok) {
				await logger.error('[DEBUG] Backend error', {
					status: backendRes.status,
					data,
				});
				return NextResponse.json(
					{error: data.error || 'Backend error'},
					{status: backendRes.status},
				);
			}
			await logger.info('[DEBUG] Sign-in approval result from backend', data);
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
			await logger.info(
				'[DEBUG] Production on Pi: checking approval and user in DB',
				{
					email,
				},
			);
			const {AuthService} = await import('@/services/authService');
			const user = await AuthService.findUserByEmail(email);
			const approved = !!user;
			await logger.info('[DEBUG] Pi approval logic', {
				email,
				userFound: !!user,
				approved,
				env: 'prod-pi',
				isDev: env.isDev,
				isProd: env.isProd,
				isVercel: deployment.isVercel,
				isPi: deployment.isPi,
				flags: {...env, ...deployment},
			});
			return NextResponse.json({
				approved,
				message: approved
					? '[DEBUG] Pi approval: user exists'
					: '[DEBUG] Pi approval: denied (user missing)',
				env: 'prod-pi',
				isDev: env.isDev,
				isProd: env.isProd,
				isVercel: deployment.isVercel,
				isPi: deployment.isPi,
				flags: {...env, ...deployment},
			});
		}

		await logger.warn('[DEBUG] Unknown environment, denying sign-in');
		return NextResponse.json(
			{approved: false, message: '[DEBUG] Unknown environment'},
			{status: 500},
		);
	} catch (error: any) {
		await logger.error('[DEBUG] Internal server error', error);
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}
