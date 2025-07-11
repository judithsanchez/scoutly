import {NextResponse} from 'next/server';
import {env, deployment, secret, header} from '@/config/environment';
import {Logger} from '@/utils/logger';

const logger = new Logger('InternalAuthSessionRoute');

// --- POST handler for JWT/session enrichment from Vercel and dev ---
export async function POST(req: Request) {
	logger.debug('POST /api/internal/auth/session called');
	const apiSecret = req.headers.get(header.internalApiSecret);
	if (apiSecret !== secret.internalApiSecret) {
		logger.warn('Unauthorized: invalid internal API secret');
		return NextResponse.json({error: 'Unauthorized'}, {status: 401});
	}

	try {
		let email: string | undefined;
		if (env.isDev) {
			// In dev, allow email via header for easier testing
			email = (req.headers.get('x-dev-email') || '').toLowerCase();
			if (!email) {
				// Fallback to body if not in header
				const body = await req.json().catch(() => ({}));
				email = (body.email || '').toLowerCase();
			}
		} else {
			const body = await req.json();
			email = (body.email || '').toLowerCase();
		}

		if (!email) {
			logger.warn('No email provided in POST body or header');
			return NextResponse.json({error: 'No email provided'}, {status: 400});
		}
		const {AuthService} = await import('@/services/authService');
		const user = await AuthService.findUserByEmail(email);
		if (!user) {
			logger.warn('User not found', {email});
			return NextResponse.json({error: 'User not found'}, {status: 404});
		}
		const isAdmin = await AuthService.isAdmin(email);
		const hasCompleteProfile = await AuthService.hasCompleteProfile(user);
		logger.info('POST session enrichment', {
			email,
			isAdmin,
			hasCompleteProfile,
			cvUrl: user.cvUrl,
		});
		return NextResponse.json({
			email: user.email,
			isAdmin,
			hasCompleteProfile,
			cvUrl: user.cvUrl,
		});
	} catch (error: any) {
		logger.error('Unhandled error in POST /api/internal/auth/session', error);
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}
