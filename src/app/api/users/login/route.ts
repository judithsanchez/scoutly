
import { corsOptionsResponse, addCorsHeaders } from '@/utils/cors';

export async function OPTIONS() {
  return corsOptionsResponse('users/login');
}
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { UserService } from '@/services/userService';
import { logger } from '@/utils/logger';
import { deployment, header, secret, apiBaseUrl, env } from '@/config/environment';
import { z } from 'zod';
import { signJwt } from '@/utils/jwt';
import { proxyToBackend } from '@/utils/proxyToBackend';
import { endpoint } from '@/constants/apiEndpoints';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest): Promise<Response> {
  if (deployment.isVercel && env.isProd) {
	// Log environment variable presence for debugging
	console.log('[LOGIN][PROXY][Vercel] INTERNAL_API_SECRET present:', !!process.env.INTERNAL_API_SECRET);
	console.log('[LOGIN][PROXY][Vercel] JWT_SECRET present:', !!process.env.JWT_SECRET);
	const apiUrlFull = `${apiBaseUrl.prod}${endpoint.users.login}`;
	// Log headers before proxying
	console.log('[LOGIN][PROXY][Vercel] Request headers:', Object.fromEntries(req.headers.entries()));
	const proxyRes = await proxyToBackend({
	  request: req,
	  backendUrl: apiUrlFull,
	  methodOverride: 'POST',
	  logPrefix: '[USERS][LOGIN][PROXY]',
	});
  return addCorsHeaders(proxyRes, 'users/login');
  }

  try {
	await logger.debug('[USERS][LOGIN][POST] Login endpoint called');
	// Log environment variable presence for debugging
	console.log('[LOGIN][LOCAL] INTERNAL_API_SECRET present:', !!process.env.INTERNAL_API_SECRET);
	console.log('[LOGIN][LOCAL] JWT_SECRET present:', !!process.env.JWT_SECRET);
	// Log headers received
	console.log('[LOGIN][LOCAL] Request headers:', Object.fromEntries(req.headers.entries()));
	// Check both original and lowercase header for case-insensitivity
	const apiSecret =
	  req.headers.get(header.INTERNAL_API_SECRET) ||
	  req.headers.get(header.INTERNAL_API_SECRET.toLowerCase());
	console.log('[LOGIN][LOCAL] Received INTERNAL_API_SECRET header:', apiSecret);

	if (!apiSecret || apiSecret !== secret.internalApiSecret) {
	  await logger.error('[USERS][LOGIN][POST] Unauthorized login attempt', {
		received: apiSecret,
		expected: secret.internalApiSecret,
		header: header.INTERNAL_API_SECRET,
	  });
	  console.log('[LOGIN][LOCAL] Unauthorized login attempt', {
		received: apiSecret,
		expected: secret.internalApiSecret,
		header: header.INTERNAL_API_SECRET,
	  });
	  return addCorsHeaders(
		NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
		'users/login'
	  );
	}

	const body = await req.json();
	const parseResult = LoginSchema.safeParse(body);

	if (!parseResult.success) {
	  await logger.warn('[USERS][LOGIN][POST] Invalid login payload', {
		issues: parseResult.error.issues,
	  });
	  return addCorsHeaders(
		NextResponse.json(
		  { error: 'Invalid payload', details: parseResult.error.issues },
		  { status: 400 }
		),
		'users/login'
	  );
	}

	const { email, password } = parseResult.data;
	const cred = await UserService.getCredentialByEmail(email);
	if (!cred) {
	  await logger.info('[USERS][LOGIN][POST] Login failed: user not found', {
		email,
	  });
	  return addCorsHeaders(
		NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }),
		'users/login'
	  );
	}
	const valid = await bcrypt.compare(password, cred.passwordHash);
	if (!valid) {
	  await logger.info('[USERS][LOGIN][POST] Login failed: invalid password', {
		email,
	  });
	  return addCorsHeaders(
		NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }),
		'users/login'
	  );
	}

	const user = await UserService.getUserByEmail(email);
	if (!user) {
	  await logger.info(
		'[USERS][LOGIN][POST] Login failed: user profile not found',
		{ email }
	  );
	  return addCorsHeaders(
		NextResponse.json(
		  { error: 'User profile not found' },
		  { status: 404 }
		),
		'users/login'
	  );
	}

	let isAdmin = false;
	try {
	  const { AdminUserService } = await import('@/services/adminUserService');
	  isAdmin = await AdminUserService.isAdmin(email);
	} catch (e) {
	  await logger.warn('[USERS][LOGIN][POST] Could not check admin status', {
		email,
		error: e,
	  });
	}

	const token = signJwt({
	  userId: user.userId,
	  email: user.email,
	  isAdmin,
	});

	await logger.success('[USERS][LOGIN][POST] User logged in', {
	  email,
	  isAdmin,
	});
  return addCorsHeaders(
	NextResponse.json({
	  token,
	  user: { ...user.toObject(), isAdmin },
	}),
	'users/login'
  );
  } catch (err) {
	await logger.error('[USERS][LOGIN][POST] Login endpoint server error', err);
  return addCorsHeaders(
	NextResponse.json({ error: 'Server error' }, { status: 500 }),
	'users/login'
  );
  }
}
