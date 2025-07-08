import {NextRequest, NextResponse} from 'next/server';

// PATCH /api/users/promote
export async function PATCH(request: NextRequest) {
	try {
		// Proxy the request to the backend API
		const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
		const backendUrl = `${apiUrl.replace(/\/$/, '')}/users/promote`;

		// Forward all headers, including internal API secret
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};
		const secret = request.headers.get('x-internal-api-secret');
		if (secret) headers['x-internal-api-secret'] = secret;

		const backendRes = await fetch(backendUrl, {
			method: 'PATCH',
			headers,
			body: JSON.stringify(await request.json()),
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
