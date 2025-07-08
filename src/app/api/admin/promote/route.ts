import {NextResponse} from 'next/server';
// import connectToDB from '@/lib/db';
// import {AdminUser} from '@/models/AdminUser';
// import {User} from '@/models/User';

export async function POST(req: Request) {
	try {
		const secret = req.headers.get('X-Internal-API-Secret');
		if (secret !== process.env.INTERNAL_API_SECRET) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401});
		}

		const {email} = await req.json();
		if (!email) {
			return NextResponse.json({error: 'Missing email'}, {status: 400});
		}

		// Proxy the request to the backend API
		const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
		const backendUrl = `${apiUrl.replace(/\/$/, '')}/admin/promote`;

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
