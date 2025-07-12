import {NextRequest, NextResponse} from 'next/server';
import {UserService} from '@/services/userService';
import {logger} from '@/utils/logger';
import {deployment, header, secret} from '@/config/environment';
import {z} from 'zod';

const ForgotPasswordSchema = z.object({
	userId: z.string(),
});

export async function POST(req: NextRequest) {
	if (!deployment.isVercel) {
		try {
			await logger.debug('Forgot-password endpoint called');
			const apiSecret = req.headers.get(header.internalApiSecret);

			if (!apiSecret || apiSecret !== secret.internalApiSecret) {
				await logger.error('Unauthorized forgot-password attempt');
				return NextResponse.json({error: 'Unauthorized'}, {status: 401});
			}

			const body = await req.json();
			const parseResult = ForgotPasswordSchema.safeParse(body);

			if (!parseResult.success) {
				await logger.warn('Invalid forgot-password payload', {
					issues: parseResult.error.issues,
				});
				return NextResponse.json(
					{error: 'Invalid payload', details: parseResult.error.issues},
					{status: 400},
				);
			}

			const {userId} = parseResult.data;
			const cred = await UserService.getCredentialByUserId(userId);
			if (!cred) {
				await logger.info('User not found for forgot-password', {userId});
				return NextResponse.json({error: 'User not found'}, {status: 404});
			}
			await logger.success('Forgot-password hash returned', {userId});
			return NextResponse.json({passwordHash: cred.passwordHash});
		} catch (err) {
			await logger.error('Forgot-password endpoint server error', err);
			return NextResponse.json({error: 'Server error'}, {status: 500});
		}
	}
}
