// GET /api/users/profile
import {NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {User} from '@/models/User';
import connectToDB from '@/lib/db';

export async function GET(req: Request) {
	// Get session
	const session = await getServerSession(authOptions);
	if (!session || !session.user?.email) {
		return NextResponse.json({error: 'Unauthorized'}, {status: 401});
	}

	try {
		await connectToDB();
		const user = await User.findOne({email: session.user.email.toLowerCase()});
		if (!user) {
			return NextResponse.json({error: 'User not found'}, {status: 404});
		}

		// Only return profile-relevant fields
		const profile = {
			email: user.email,
			name: user.candidateInfo?.name || '',
			cvUrl: user.cvUrl || '',
			candidateInfo: user.candidateInfo || null,
			hasCompleteProfile: !!(user.cvUrl && user.candidateInfo),
		};

		return NextResponse.json(profile);
	} catch (error) {
		return NextResponse.json({error: 'Internal server error'}, {status: 500});
	}
}
