export const dynamic = 'force-dynamic';
import {NextRequest, NextResponse} from 'next/server';
// import {getServerSession} from 'next-auth/next';
// import {isAdminUserAsync} from '@/utils/adminUtils';
// import {connectToDatabase} from '@/lib/mongodb';
// import {Log} from '@/models/Log';
// import {TokenUsage} from '@/models/TokenUsage';
// import {CompanyScrapeHistory} from '@/models/CompanyScrapeHistory';
// import {SavedJob} from '@/models/SavedJob';
// import {UserCompanyPreference} from '@/models/UserCompanyPreference';

export async function GET(request: NextRequest) {
	try {
		// Forward the request to the backend API
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

// All dashboard data is now proxied from the backend API
