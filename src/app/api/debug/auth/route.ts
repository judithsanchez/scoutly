import {NextRequest, NextResponse} from 'next/server';
import {authOptions} from '@/lib/auth';

export async function GET(request: NextRequest) {
	// Only allow in development
	if (process.env.NODE_ENV !== 'development') {
		return NextResponse.json({error: 'Not available in production'}, {status: 403});
	}

	// Check which auth provider is being used
	const useDevAuth = process.env.NEXT_PUBLIC_USE_DEV_AUTH === 'true';
	const hasGoogleProvider = authOptions.providers?.some(p => 'id' in p && p.id === 'google');
	const hasDevelopmentProvider = authOptions.providers?.some(p => 'id' in p && p.id === 'development');

	return NextResponse.json({
		useDevAuth,
		providers: authOptions.providers?.map(p => ('id' in p ? p.id : 'unknown')),
		hasGoogleProvider,
		hasDevelopmentProvider,
		totalProviders: authOptions.providers?.length || 0,
	});
}
