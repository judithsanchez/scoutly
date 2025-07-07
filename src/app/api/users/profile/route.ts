// GET /api/users/profile
import {NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {User} from '@/models/User';
import connectToDB from '@/lib/db';


import { getAllowedOrigin } from '@/utils/cors';

function setCORSHeaders(res: NextResponse, req?: Request) {
	const requestOrigin = req?.headers.get('origin') || null;
	const allowedOrigin = getAllowedOrigin(requestOrigin);
	if (allowedOrigin) {
		res.headers.set('Access-Control-Allow-Origin', allowedOrigin);
		res.headers.set('Vary', 'Origin');
	} else {
		// Optionally, do not set the header if not allowed
	}
	res.headers.set('Access-Control-Allow-Credentials', 'true');
	res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
	res.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
	return res;
}

export async function OPTIONS(req: Request) {
	// Preflight CORS support
	const res = new NextResponse(null, { status: 204 });
	return setCORSHeaders(res, req);
}

export async function GET(req: Request) {
	// Get session
	const session = await getServerSession(authOptions);
	if (!session || !session.user?.email) {
		return setCORSHeaders(
			NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
			req
		);
	}

	try {
		await connectToDB();
		const user = await User.findOne({ email: session.user.email.toLowerCase() });
		if (!user) {
			return setCORSHeaders(
				NextResponse.json({ error: 'User not found' }, { status: 404 }),
				req
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

		return setCORSHeaders(NextResponse.json(profile), req);
	} catch (error) {
		return setCORSHeaders(
			NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
			req
		);
	}
}
