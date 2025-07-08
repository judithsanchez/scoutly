export const dynamic = 'force-dynamic';

import {NextRequest, NextResponse} from 'next/server';

// GET /api/user-company-preferences
export async function GET(request: NextRequest) {
	try {
		const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
		const backendUrl = `${apiUrl.replace(/\/$/, '')}/user-company-preferences${
			request.url.includes('?')
				? request.url.substring(request.url.indexOf('?'))
				: ''
		}`;

		const backendRes = await fetch(backendUrl, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
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
	} catch (error: any) {
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}

// POST /api/user-company-preferences
export async function POST(request: NextRequest) {
	try {
		const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
		const backendUrl = `${apiUrl.replace(/\/$/, '')}/user-company-preferences`;

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

		return NextResponse.json(data);
	} catch (error: any) {
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}

// PATCH /api/user-company-preferences
export async function PATCH(request: NextRequest) {
	try {
		const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
		const backendUrl = `${apiUrl.replace(/\/$/, '')}/user-company-preferences`;

		const backendRes = await fetch(backendUrl, {
			method: 'PATCH',
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

// DELETE /api/user-company-preferences
export async function DELETE(request: NextRequest) {
	try {
		const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
		const backendUrl = `${apiUrl.replace(/\/$/, '')}/user-company-preferences`;

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
