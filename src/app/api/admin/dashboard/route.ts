export const dynamic = 'force-dynamic';
import {NextRequest, NextResponse} from 'next/server';

export async function GET(request: NextRequest) {
	try {
		const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
		const backendUrl = `${apiUrl.replace(/\/$/, '')}/admin/dashboard`;

		const backendRes = await fetch(backendUrl, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				...(request.headers.get('Authorization')
					? {Authorization: request.headers.get('Authorization')!}
					: {}),
			},
		});

		const data = await backendRes.json();

		if (!backendRes.ok) {
			return NextResponse.json(
				{error: data.error || 'Backend error'},
				{status: backendRes.status},
			);
		}

		return NextResponse.json(data);
	} catch (error) {
		console.error('Admin dashboard error:', error);
		return NextResponse.json({error: 'Internal server error'}, {status: 500});
	}
}
