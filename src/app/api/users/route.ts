import {NextRequest, NextResponse} from 'next/server';
// import {UserService} from '@/services/userService';
// import {SavedJobService} from '@/services/savedJobService';
// import {EnhancedLogger} from '@/utils/enhancedLogger';
// import dbConnect from '@/middleware/database';
// import {
//     CreateUserRequestSchema,
//     CreateUserResponseSchema,
//     GetUsersResponseSchema,
//     ErrorResponseSchema,
//     type CreateUserRequest,
// } from '@/schemas/userSchemas';

// POST /api/users
export async function POST(request: NextRequest) {
	try {
		// Proxy the request to the backend API
		const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
		const backendUrl = `${apiUrl.replace(/\/$/, '')}/users`;

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

// GET /api/users
export async function GET() {
	try {
		// Proxy the request to the backend API
		const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
		const backendUrl = `${apiUrl.replace(/\/$/, '')}/users`;

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
