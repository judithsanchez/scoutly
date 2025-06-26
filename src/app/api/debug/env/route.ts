import {NextRequest, NextResponse} from 'next/server';

export async function GET(request: NextRequest) {
	// Only allow in development
	if (process.env.NODE_ENV !== 'development') {
		return NextResponse.json({error: 'Not available in production'}, {status: 403});
	}

	// Return environment variables (only safe ones for debugging)
	const envVars = {
		NODE_ENV: process.env.NODE_ENV,
		NEXT_PUBLIC_USE_DEV_AUTH: process.env.NEXT_PUBLIC_USE_DEV_AUTH,
		MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'NOT_SET',
		NEXTAUTH_URL: process.env.NEXTAUTH_URL,
		NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT_SET',
		GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT_SET',
		GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT_SET',
	};

	return NextResponse.json(envVars);
}
