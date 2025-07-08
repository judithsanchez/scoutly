export const dynamic = 'force-dynamic';

import {NextRequest, NextResponse} from 'next/server';

// DELETE /api/user-company-preferences/[companyId]
export async function DELETE(
	request: NextRequest,
	{params}: {params: {companyId: string}},
) {
	try {
		const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
		const backendUrl = `${apiUrl.replace(/\/$/, '')}/user-company-preferences/${
			params.companyId
		}`;

		const backendRes = await fetch(backendUrl, {
			method: 'DELETE',
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

		return NextResponse.json(data);
	} catch (error: any) {
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}

// PUT /api/user-company-preferences/[companyId]
export async function PUT(
	request: NextRequest,
	{params}: {params: {companyId: string}},
) {
	try {
		const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
		const backendUrl = `${apiUrl.replace(/\/$/, '')}/user-company-preferences/${
			params.companyId
		}`;

		const backendRes = await fetch(backendUrl, {
			method: 'PUT',
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

		return NextResponse.json(data);
	} catch (error: any) {
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}
