import {NextRequest, NextResponse} from 'next/server';
import bcrypt from 'bcryptjs';
import {UserService} from '@/services/userService';
import {logger} from '@/utils/logger';
import {deployment, header, secret} from '@/config/environment';
import {z} from 'zod';
import {signJwt} from '@/utils/jwt';

const LoginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
});

export async function POST(req: NextRequest) {
	if (!deployment.isVercel) {
		try {
			await logger.debug('Login endpoint called');
			const apiSecret = req.headers.get(header.internalApiSecret);

			if (!apiSecret || apiSecret !== secret.internalApiSecret) {
				await logger.error('Unauthorized login attempt');
				return NextResponse.json({error: 'Unauthorized'}, {status: 401});
			}

			const body = await req.json();
			const parseResult = LoginSchema.safeParse(body);

			if (!parseResult.success) {
				await logger.warn('Invalid login payload', {
					issues: parseResult.error.issues,
				});
				return NextResponse.json(
					{error: 'Invalid payload', details: parseResult.error.issues},
					{status: 400},
				);
			}

			const {email, password} = parseResult.data;
			const cred = await UserService.getCredentialByEmail(email);
			if (!cred) {
				await logger.info('Login failed: user not found', {email});
				return NextResponse.json({error: 'Invalid credentials'}, {status: 401});
			}
			const valid = await bcrypt.compare(password, cred.passwordHash);
			if (!valid) {
				await logger.info('Login failed: invalid password', {email});
				return NextResponse.json({error: 'Invalid credentials'}, {status: 401});
			}

			const user = await UserService.getUserByEmail(email);
			if (!user) {
				await logger.info('Login failed: user profile not found', {email});
				return NextResponse.json(
					{error: 'User profile not found'},
					{status: 404},
				);
			}

			let isAdmin = false;
			try {
				const {AdminUserService} = await import('@/services/adminUserService');
				isAdmin = await AdminUserService.isAdmin(email);
			} catch (e) {
				await logger.warn('Could not check admin status', {email, error: e});
			}

			const token = signJwt({
				userId: user.userId,
				email: user.email,
				isAdmin,
			});

			await logger.success('User logged in', {email, isAdmin});
			return NextResponse.json({
				token,
				user: {...user.toObject(), isAdmin},
			});
		} catch (err) {
			await logger.error('Login endpoint server error', err);
			return NextResponse.json({error: 'Server error'}, {status: 500});
		}
	}
}
