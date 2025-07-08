import {NextResponse} from 'next/server';
// import {User} from '@/models/User';
// import connectToDB from '@/lib/db';
// import {Logger} from '@/utils/logger';

const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

export async function POST(req: Request) {
	const secret = req.headers.get('X-Internal-API-Secret');
	if (secret !== INTERNAL_API_SECRET) {
		// logger.warn('Unauthorized attempt to access internal sign-in API');
		return NextResponse.json({error: 'Unauthorized'}, {status: 401});
	}

	try {
		// Proxy the request to the backend API
		const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
		const backendUrl = `${apiUrl.replace(/\/$/, '')}/internal/auth/signin`;

		const {email} = await req.json();
		if (!email) {
			return NextResponse.json(
				{approved: false, message: 'No email provided'},
				{status: 400},
			);
		}

		const backendRes = await fetch(backendUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Internal-API-Secret': secret || '',
			},
			body: JSON.stringify({email}),
		});

		const data = await backendRes.json();

		if (!backendRes.ok) {
			return NextResponse.json(
				{error: data.error || 'Backend error'},
				{status: backendRes.status},
			);
		}

		return NextResponse.json(data);
	} catch (error: any) {
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}
