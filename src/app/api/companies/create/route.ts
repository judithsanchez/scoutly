export const dynamic = 'force-dynamic';

import {NextRequest, NextResponse} from 'next/server';

// POST /api/companies/create
export async function POST(request: NextRequest) {
	try {
		const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
		const backendUrl = `${apiUrl.replace(/\/$/, '')}/companies/create`;

		const backendRes = await fetch(backendUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(await request.json()),
		});

		const data = await backendRes.json();

		if (!backendRes.ok) {
			return NextResponse.json(
				{error: data.error || 'Backend error'},
				{status: backendRes.status},
			);
		}

		return NextResponse.json(data, {status: 201});
	} catch (error: any) {
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}
