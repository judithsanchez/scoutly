import { corsOptionsResponse } from '@/utils/cors';

export async function OPTIONS() {
  return corsOptionsResponse('users/profile');
}
import {NextRequest, NextResponse} from 'next/server';
import {UserService} from '@/services/userService';
import {logger} from '@/utils/logger';
import {deployment, header, secret} from '@/config/environment';
import {z} from 'zod';
import {CandidateInfoSchema} from '@/schemas/userSchemas';

const UpdateProfileSchema = z.object({
	email: z.string().email(),
	cvUrl: z.string().url().optional(),
	candidateInfo: CandidateInfoSchema.optional(),
});

export async function GET(req: NextRequest) {
	if (!deployment.isVercel) {
		try {
			await logger.debug('Profile endpoint called');
			const apiSecret =
  req.headers.get(header.INTERNAL_API_SECRET) ||
  req.headers.get(header.INTERNAL_API_SECRET.toLowerCase());

			if (!apiSecret || apiSecret !== secret.internalApiSecret) {
				await logger.error('Unauthorized profile attempt');
				return NextResponse.json({error: 'Unauthorized'}, {status: 401});
			}

			const {searchParams} = new URL(req.url);
			const userId = searchParams.get('userId');
			if (!userId) {
				await logger.warn('Missing userId in profile request');
				return NextResponse.json({error: 'Missing userId'}, {status: 400});
			}

			const user = await UserService.getUserById(userId);
			if (!user) {
				await logger.info('User not found for profile', {userId});
				return NextResponse.json({error: 'User not found'}, {status: 404});
			}

			let isAdmin = false;
			try {
				const {AdminUserService} = await import('@/services/adminUserService');
				isAdmin = await AdminUserService.isAdmin(user.email);
			} catch (e) {
				await logger.warn('Could not check admin status', {userId, error: e});
			}

			await logger.success('Profile returned', {userId});
			return NextResponse.json({user: {...user.toObject(), isAdmin}});
		} catch (err) {
			await logger.error('Profile endpoint server error', err);
			return NextResponse.json({error: 'Server error'}, {status: 500});
		}
	}
}

export async function PATCH(req: NextRequest) {
	if (!deployment.isVercel) {
		try {
			await logger.debug('Profile update endpoint called');
			const apiSecret =
  req.headers.get(header.INTERNAL_API_SECRET) ||
  req.headers.get(header.INTERNAL_API_SECRET.toLowerCase());

			if (!apiSecret || apiSecret !== secret.internalApiSecret) {
				await logger.error('Unauthorized profile update attempt');
				return NextResponse.json({error: 'Unauthorized'}, {status: 401});
			}

			const body = await req.json();
			const parseResult = UpdateProfileSchema.safeParse(body);

			if (!parseResult.success) {
				await logger.warn('Invalid profile update payload', {
					issues: parseResult.error.issues,
				});
				return NextResponse.json(
					{error: 'Invalid payload', details: parseResult.error.issues},
					{status: 400},
				);
			}

			const {email, cvUrl, candidateInfo} = parseResult.data;
			const updated = await UserService.updateUserProfile(email, {
				cvUrl,
				candidateInfo,
			});
			if (!updated) {
				await logger.info('User not found for profile update', {email});
				return NextResponse.json({error: 'User not found'}, {status: 404});
			}

			await logger.success('Profile updated', {email});
			return NextResponse.json({user: updated});
		} catch (err) {
			await logger.error('Profile update endpoint server error', err);
			return NextResponse.json({error: 'Server error'}, {status: 500});
		}
	}
}
