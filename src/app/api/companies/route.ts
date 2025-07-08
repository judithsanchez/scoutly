export const dynamic = 'force-dynamic';
import {NextRequest, NextResponse} from 'next/server';

export async function GET(request: NextRequest) {
	// Proxy the request to the backend API running on the Raspberry Pi
	const backendUrl = process.env.NEXT_PUBLIC_API_URL;
	if (!backendUrl) {
		return NextResponse.json(
			{error: 'Backend API URL not configured'},
			{status: 500},
		);
	}
	try {
		const res = await fetch(`${backendUrl}/companies`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		if (!res.ok) {
			return NextResponse.json(
				{error: 'Failed to fetch companies from backend API'},
				{status: res.status},
			);
		}
		const companies = await res.json();
		return NextResponse.json(companies);
	} catch (error) {
		return NextResponse.json(
			{
				error: 'Error connecting to backend API',
				details: (error as Error).message,
			},
			{status: 500},
		);
	}
}
