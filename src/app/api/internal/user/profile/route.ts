// Internal API endpoint for fetching user profile by email (no session required)
import {NextResponse} from 'next/server';
import {User} from '@/models/User';
import connectToDB from '@/lib/db';

export const POST = async (req: Request) => {
	const secret = req.headers.get('x-internal-api-secret');
	if (secret !== process.env.INTERNAL_API_SECRET) {
		return NextResponse.json({error: 'Forbidden'}, {status: 403});
	}

	try {
		const {email} = await req.json();
		if (!email) {
			return NextResponse.json({error: 'Email required'}, {status: 400});
		}
		await connectToDB();
		const user = await User.findOne({email: email.toLowerCase()});
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
};
