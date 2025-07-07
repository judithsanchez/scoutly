export const dynamic = 'force-dynamic';
import {NextRequest, NextResponse} from 'next/server';
import {checkForStaleJobs} from '@/utils/staleJobChecker';

/**
 * API route to check for stale job applications and mark them as STALE.
 * This can be called manually or by a scheduled job.
 */
export async function GET(request: NextRequest) {
	const result = await checkForStaleJobs();
	return NextResponse.json(result);
}
