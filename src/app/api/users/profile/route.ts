// GET /api/users/profile
import {NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {User} from '@/models/User';
import connectToDB from '@/lib/db';

import {getAllowedOrigin} from '@/utils/cors';

function setCORSHeaders(res: NextResponse, req?: Request) {
	const requestOrigin = req?.headers.get('origin') || null;
	const allowedOrigin = getAllowedOrigin(requestOrigin);
	console.log('[CORS DEBUG] setCORSHeaders called');
	console.log('[CORS DEBUG] requestOrigin:', requestOrigin);
	console.log('[CORS DEBUG] allowedOrigin:', allowedOrigin);
	if (allowedOrigin) {
		res.headers.set('Access-Control-Allow-Origin', allowedOrigin);
		res.headers.set('Vary', 'Origin');
		console.log('[CORS DEBUG] Access-Control-Allow-Origin set:', allowedOrigin);
	} else {
		console.log('[CORS DEBUG] Origin not allowed, header not set');
	}
	res.headers.set('Access-Control-Allow-Credentials', 'true');
	res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
	res.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
	return res;
}

export const OPTIONS = async (req: Request) => {
	console.log('[CORS DEBUG] OPTIONS handler called for /api/users/profile');
	// Preflight CORS support
	const res = new NextResponse(null, {status: 204});
	return setCORSHeaders(res, req);
};

export const GET = async (req: Request) => {
	console.log('[CORS DEBUG] GET handler called for /api/users/profile');
	// Get session
	const session = await getServerSession(authOptions);
	if (!session || !session.user?.email) {
		console.log('[CORS DEBUG] No session or user email');
		return setCORSHeaders(
			NextResponse.json({error: 'Unauthorized'}, {status: 401}),
			req,
		);
	}

	try {
		await connectToDB();
		const user = await User.findOne({
			email: session.user.email.toLowerCase(),
		});
		if (!user) {
			console.log('[CORS DEBUG] User not found:', session.user.email);
			return setCORSHeaders(
				NextResponse.json({error: 'User not found'}, {status: 404}),
				req,
			);
		}

		// Only return profile-relevant fields
		const profile = {
			email: user.email,
			name: user.candidateInfo?.name || '',
			cvUrl: user.cvUrl || '',
			candidateInfo: user.candidateInfo || null,
			hasCompleteProfile: !!(user.cvUrl && user.candidateInfo),
		};

		console.log('[CORS DEBUG] Returning profile:', profile.email);
		return setCORSHeaders(NextResponse.json(profile), req);
	} catch (error) {
		console.log('[CORS DEBUG] Internal server error:', error);
		return setCORSHeaders(
			NextResponse.json({error: 'Internal server error'}, {status: 500}),
			req,
		);
	}
};
