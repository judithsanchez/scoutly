
import { corsOptionsResponse } from '@/utils/cors';
import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/services/userService';
import { logger } from '@/utils/logger';
import { apiBaseUrl, deployment, env, header, secret } from '@/config/environment';
import { z } from 'zod';
import { CandidateInfoSchema } from '@/schemas/userSchemas';
import { requireAuth } from '@/utils/requireAuth';
import { endpoint } from '@/constants';

export async function OPTIONS() {
  return corsOptionsResponse('users/profile');
}

const UpdateProfileSchema = z.object({
	email: z.string().email(),
	cvUrl: z.string().url().optional(),
	candidateInfo: CandidateInfoSchema.optional(),
});

export async function GET(request: NextRequest): Promise<Response> {
  await logger.debug('[USERS][PROFILE][GET] Incoming headers', {
	headers: Object.fromEntries(request.headers.entries()),
  });

  if (deployment.isVercel && env.isProd) {
	const apiUrlFull = `${apiBaseUrl.prod}${endpoint.users.profile}`;
	return fetch(apiUrlFull, {
	  method: 'GET',
	  headers: Object.fromEntries(request.headers.entries()),
	}).then(async (res) => {
	  const data = await res.json();
	  return NextResponse.json(data, { status: res.status });
	});
  }

  try {
	await logger.debug('[USERS][PROFILE][GET] Profile endpoint called');
	const { user, response } = await requireAuth(request);
	if (!user || typeof user !== 'object' || !('userId' in user)) {
	  await logger.warn('[USERS][PROFILE][GET] Unauthorized access attempt or invalid user payload');
	  return response as Response;
	}

	const dbUser = await UserService.getUserById(user.userId);
	if (!dbUser) {
	  await logger.info('[USERS][PROFILE][GET] User not found for profile', { userId: user.userId });
	  return NextResponse.json({ error: 'User not found' }, { status: 404 });
	}

	let isAdmin = false;
	try {
	  const { AdminUserService } = await import('@/services/adminUserService');
	  isAdmin = await AdminUserService.isAdmin(dbUser.email);
	} catch (e) {
	  await logger.warn('[USERS][PROFILE][GET] Could not check admin status', { userId: user.userId, error: e });
	}

	await logger.success('[USERS][PROFILE][GET] Profile returned', { userId: user.userId });
	return NextResponse.json({ user: { ...dbUser.toObject(), isAdmin } });
  } catch (err) {
	await logger.error('[USERS][PROFILE][GET] Profile endpoint server error', err);
	return NextResponse.json({ error: 'Server error' }, { status: 500 });
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
