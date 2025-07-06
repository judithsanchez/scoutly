// GET /api/users/profile
import {NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {User} from '@/models/User';
import connectToDB from '@/lib/db';

function setCORSHeaders(res: NextResponse) {
	res.headers.set('Access-Control-Allow-Origin', 'https://www.jobscoutly.tech');
	res.headers.set('Access-Control-Allow-Credentials', 'true');
	res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
	res.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
	return res;
}

export async function OPTIONS() {
	// Preflight CORS support
	const res = new NextResponse(null, {status: 204});
	return setCORSHeaders(res);
}

export async function GET(req: Request) {
	// Get session
	const session = await getServerSession(authOptions);
	if (!session || !session.user?.email) {
		return setCORSHeaders(
			NextResponse.json({error: 'Unauthorized'}, {status: 401}),
		);
	}

	try {
		await connectToDB();
		const user = await User.findOne({email: session.user.email.toLowerCase()});
		if (!user) {
			return setCORSHeaders(
				NextResponse.json({error: 'User not found'}, {status: 404}),
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

		return setCORSHeaders(NextResponse.json(profile));
	} catch (error) {
		return setCORSHeaders(
			NextResponse.json({error: 'Internal server error'}, {status: 500}),
		);
	}
}
