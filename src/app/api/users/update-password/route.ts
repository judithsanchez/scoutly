// --- CORS OPTIONS handler ---
import { corsOptionsResponse } from '@/utils/cors';

export async function OPTIONS() {
  return corsOptionsResponse('users/update-password');
}
import {NextRequest, NextResponse} from 'next/server';
import bcrypt from 'bcryptjs';
import {UserService} from '@/services/userService';
import {logger} from '@/utils/logger';
import {deployment, header, secret} from '@/config/environment';
import {z} from 'zod';

const UpdatePasswordSchema = z.object({
	email: z.string().email(),
	currentPassword: z.string().min(8),
	newPassword: z.string().min(8),
});

export async function PATCH(req: NextRequest) {
	if (!deployment.isVercel) {
		try {
			await logger.debug('Update password endpoint called');
			const apiSecret =
  req.headers.get(header.INTERNAL_API_SECRET) ||
  req.headers.get(header.INTERNAL_API_SECRET.toLowerCase());

			if (!apiSecret || apiSecret !== secret.internalApiSecret) {
				await logger.error('Unauthorized update-password attempt');
				return NextResponse.json({error: 'Unauthorized'}, {status: 401});
			}

			const body = await req.json();
			const parseResult = UpdatePasswordSchema.safeParse(body);

			if (!parseResult.success) {
				await logger.warn('Invalid update-password payload', {
					issues: parseResult.error.issues,
				});
				return NextResponse.json(
					{error: 'Invalid payload', details: parseResult.error.issues},
					{status: 400},
				);
			}

			const {email, currentPassword, newPassword} = parseResult.data;

			const cred = await UserService.getCredentialByEmail(email);
			if (!cred) {
				await logger.info('User not found for update-password', {email});
				return NextResponse.json({error: 'User not found'}, {status: 404});
			}
			const valid = await bcrypt.compare(currentPassword, cred.passwordHash);
			if (!valid) {
				await logger.warn('Current password incorrect', {email});
				return NextResponse.json(
					{error: 'Current password incorrect'},
					{status: 403},
				);
			}
			const newHash = await bcrypt.hash(newPassword, 12);
			await UserService.updateCredentialPassword(email, newHash);

			await logger.success('Password updated', {email});
			return NextResponse.json({success: true});
		} catch (err) {
			await logger.error('Update-password endpoint server error', err);
			return NextResponse.json({error: 'Server error'}, {status: 500});
		}
	}
}
