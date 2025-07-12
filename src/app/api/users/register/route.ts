import {NextRequest, NextResponse} from 'next/server';
import bcrypt from 'bcryptjs';
import {UserService} from '@/services/userService';
import {logger} from '@/utils/logger';
import {deployment, header, secret} from '@/config/environment';
import {registerSchema} from '@/schemas/userSchemas';
export async function POST(req: NextRequest) {
	if (!deployment.isVercel) {
		try {
			await logger.debug('Registration endpoint called');
			const apiSecret = req.headers.get(header.internalApiSecret);

			if (!apiSecret || apiSecret !== secret.internalApiSecret) {
				await logger.error('Unauthorized registration attempt');
				return NextResponse.json({error: 'Unauthorized'}, {status: 401});
			}

			const body = await req.json();
			const parseResult = registerSchema.safeParse(body);

			if (!parseResult.success) {
				await logger.warn('Invalid registration payload', {
					issues: parseResult.error.issues,
				});
				return NextResponse.json(
					{
						error: 'Invalid registration payload',
						details: parseResult.error.issues,
					},
					{status: 400},
				);
			}

			const {email, password} = parseResult.data;

			await logger.debug('Received registration payload', {email});

			const existingCred = await UserService.getCredentialByEmail(email);
			if (existingCred) {
				await logger.info('Attempt to register existing email', {email});
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

			await logger.success('User registered', {userId: user.userId, email});

			return NextResponse.json({success: true, userId: user.userId});
		} catch (err) {
			await logger.error('Registration server error', err);

			return NextResponse.json({error: 'Server error'}, {status: 500});
		}
	}
}
