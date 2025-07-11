import {NextResponse} from 'next/server';
import {UserService} from '@/services/userService';

export async function POST(request: Request) {
	try {
		const internalSecret = request.headers.get('x-internal-secret');
		if (!internalSecret || internalSecret !== process.env.INTERNAL_API_SECRET) {
			return NextResponse.json({message: 'Forbidden'}, {status: 403});
		}
		const {email} = await request.json();
		if (!email) {
			return NextResponse.json({message: 'Missing email'}, {status: 400});
		}
		const dbUser = await UserService.getUserByEmail(email);
		return NextResponse.json({exists: !!dbUser});
	} catch (err) {
		console.error('verify-user error:', err);
		return NextResponse.json({message: 'Internal server error'}, {status: 500});
	}
}
