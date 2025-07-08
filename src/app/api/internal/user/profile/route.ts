import {NextResponse} from 'next/server';
import {
	env,
	deployment,
	apiBaseUrl,
	secret,
	header,
} from '@/config/environment';
import {endpoint} from '@/constants';

export const POST = async (req: Request) => {
	const apiSecret = req.headers.get(header.internalApiSecret);
	if (apiSecret !== secret.internalApiSecret) {
		return NextResponse.json({error: 'Forbidden'}, {status: 403});
	}

	try {
		const {email} = await req.json();
		if (!email) {
			return NextResponse.json({error: 'Email required'}, {status: 400});
		}

		if (env.isDev) {
			const {AuthService} = await import('@/services/authService');
			const user = await AuthService.findUserByEmail(email);
			if (!user) {
				return NextResponse.json({error: 'User not found'}, {status: 404});
			}
			return NextResponse.json({
				email: user.email,
				candidateInfo: user.candidateInfo,
				cvUrl: user.cvUrl,
				preferences: user.preferences,
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
			const backendUrl = `${apiBaseUrl.prod}${endpoint.auth.profile}`;
			const backendRes = await fetch(backendUrl, {
				method: 'POST',
				headers: new Headers({
					[header.internalApiSecret]: secret.internalApiSecret ?? '',
					'Content-Type': 'application/json',
				}),
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
			const {AuthService} = await import('@/services/authService');
			const user = await AuthService.findUserByEmail(email);
			if (!user) {
				return NextResponse.json({error: 'User not found'}, {status: 404});
			}
			return NextResponse.json({
				email: user.email,
				candidateInfo: user.candidateInfo,
				cvUrl: user.cvUrl,
				preferences: user.preferences,
			});
		}

		return NextResponse.json({error: 'Unknown environment'}, {status: 500});
	} catch (error: any) {
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
};
