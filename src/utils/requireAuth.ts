import {NextRequest, NextResponse} from 'next/server';
import {verifyJwt} from '@/utils/jwt';
import {header} from '@/config';

export async function requireAuth(request: NextRequest) {
	const authHeader = request.headers.get(header.authorization);
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return {
			user: null,
			response: NextResponse.json({error: 'Unauthorized'}, {status: 401}),
		};
	}
	const token = authHeader.replace('Bearer ', '').trim();
	try {
		const user = verifyJwt(token);
		if (!user) {
			return {
				user: null,
				response: NextResponse.json({error: 'Unauthorized'}, {status: 401}),
			};
		}
		return {user, response: null};
	} catch (e) {
		return {
			user: null,
			response: NextResponse.json({error: 'Unauthorized'}, {status: 401}),
		};
	}
}
