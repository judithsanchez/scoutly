import {NextRequest, NextResponse} from 'next/server';
import bcrypt from 'bcryptjs';
import {UserService} from '@/services/userService';
import {logger} from '@/utils/logger';
import {
	deployment,
	header,
	secret,
	apiBaseUrl,
	env,
} from '@/config/environment';
import {registerSchema} from '@/schemas/userSchemas';
import {proxyToBackend} from '@/utils/proxyToBackend';
import {endpoint} from '@/constants/apiEndpoints';

export async function POST(req: NextRequest): Promise<Response> {
	if (deployment.isVercel && env.isProd) {
		const apiUrlFull = `${apiBaseUrl.prod}${endpoint.users.register}`;
		return proxyToBackend({
			request: req,
			backendUrl: apiUrlFull,
			methodOverride: 'POST',
			logPrefix: '[USERS][REGISTER][PROXY]',
		});
	}

	try {
		await logger.debug('[USERS][REGISTER][POST] Registration endpoint called');
		const apiSecret = req.headers.get(header.internalApiSecret);

		if (!apiSecret || apiSecret !== secret.internalApiSecret) {
			await logger.error(
				'[USERS][REGISTER][POST] Unauthorized registration attempt',
			);
			return NextResponse.json({error: 'Unauthorized'}, {status: 401});
		}

		const body = await req.json();
		const parseResult = registerSchema.safeParse(body);

		if (!parseResult.success) {
			await logger.warn(
				'[USERS][REGISTER][POST] Invalid registration payload',
				{
					issues: parseResult.error.issues,
				},
			);
			return NextResponse.json(
				{
					error: 'Invalid registration payload',
					details: parseResult.error.issues,
				},
				{status: 400},
			);
		}

		const {email, password} = parseResult.data;

		await logger.debug(
			'[USERS][REGISTER][POST] Received registration payload',
			{email},
		);

		const existingCred = await UserService.getCredentialByEmail(email);
		if (existingCred) {
			await logger.info(
				'[USERS][REGISTER][POST] Attempt to register existing email',
				{email},
			);
			return NextResponse.json(
				{error: 'Email already registered'},
				{status: 409},
			);
		}

		const user = await UserService.createUser({email});
		const passwordHash = await bcrypt.hash(password, 12);

		await UserService.createCredential({
			userId: user.userId,
			email,
			passwordHash,
		});

		await logger.success('[USERS][REGISTER][POST] User registered', {
			userId: user.userId,
			email,
		});

		return NextResponse.json({success: true, userId: user.userId});
	} catch (err) {
		await logger.error(
			'[USERS][REGISTER][POST] Registration server error',
			err,
		);

		return NextResponse.json({error: 'Server error'}, {status: 500});
	}
}
