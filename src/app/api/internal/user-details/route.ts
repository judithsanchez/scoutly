import {NextResponse} from 'next/server';
import {UserService} from '@/services/userService';
import {secret} from '@/config/environment';

export async function GET(request: Request) {
	try {
		const internalSecret = request.headers.get('x-internal-secret');
		if (!internalSecret || internalSecret !== secret.internalApiSecret) {
			return NextResponse.json({message: 'Forbidden'}, {status: 403});
		}
		const {searchParams} = new URL(request.url);
		const email = searchParams.get('email');
		if (!email) {
			return NextResponse.json({message: 'Missing email'}, {status: 400});
		}
		const dbUser = await UserService.getUserByEmail(email);
		if (!dbUser) {
			return NextResponse.json({message: 'User not found'}, {status: 404});
		}
		return NextResponse.json({
			id: dbUser._id.toString(),
			role: dbUser.role,
			isProfileComplete: dbUser.isProfileComplete,
		});
	} catch (err) {
		console.error('user-details error:', err);
		return NextResponse.json({message: 'Internal server error'}, {status: 500});
	}
}
