import {NextRequest, NextResponse} from 'next/server';
import {verifyJwt} from '@/utils/jwt';
import {header} from '@/config/environment';

export async function requireAuth(request: NextRequest) {
	console.log(
		'[requireAuth] Incoming headers:',
		Object.fromEntries(request.headers.entries()),
	);
	console.log(
		'[requireAuth] Authorization header:',
		request.headers.get('Authorization'),
	);
	console.log(
		'[requireAuth] AUTHORIZATION header:',
		request.headers.get('AUTHORIZATION'),
	);

	const authHeader = request.headers.get(header.AUTHORIZATION);
	console.log(
		'[requireAuth] Using header.AUTHORIZATION:',
		header.AUTHORIZATION,
		'Value:',
		authHeader,
	);

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		console.log('[requireAuth] No valid Authorization header found');
		return {
			user: null,
			response: NextResponse.json({error: 'Unauthorized'}, {status: 401}),
		};
	}
	const token = authHeader.replace('Bearer ', '');
	try {
		const user = verifyJwt(token);
		console.log('[requireAuth] Decoded user:', user);
		if (!user) {
			return {
				user: null,
				response: NextResponse.json({error: 'Unauthorized'}, {status: 401}),
			};
		}
		return {user, response: null};
	} catch (err) {
		console.log('[requireAuth] Error verifying JWT:', err);
		return {
			user: null,
			response: NextResponse.json({error: 'Unauthorized'}, {status: 401}),
		};
	}
}
