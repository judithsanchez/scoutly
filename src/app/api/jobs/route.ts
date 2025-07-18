import {corsOptionsResponse} from '@/utils/cors';
export async function OPTIONS() {
	return corsOptionsResponse('jobs');
}
export const dynamic = 'force-dynamic';
import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants/apiEndpoints';
import {JobSearchRequestSchema} from '@/schemas/jobSearchSchemas';
import {logger} from '@/utils/logger';
import {requireAuth} from '@/utils/requireAuth';
import {proxyToBackend} from '@/utils/proxyToBackend';

let JobService: any;
try {
	JobService = require('@/services/jobService').JobService;
} catch {}
export async function POST(request: NextRequest) {
	await logger.debug('[JOBS][POST] Incoming headers', {
		headers: Object.fromEntries(request.headers.entries()),
	});

	// Proxy to backend if on Vercel/prod
	if (deployment.isVercel && env.isProd) {
		const apiUrlFull = `${apiBaseUrl.prod}${endpoint.jobs.search}`;
		return proxyToBackend({
			request,
			backendUrl: apiUrlFull,
			methodOverride: 'POST',
			logPrefix: '[JOBS][POST][PROXY]',
		});
	}

	await logger.debug(`POST ${endpoint.jobs.search} called`, {
		env: {...env},
		deployment: {...deployment},
		headers: Object.fromEntries(request.headers.entries()),
	});

	// Require authentication
	const {user, response} = await requireAuth(request);
	if (!user) {
		await logger.warn('[JOBS][POST] Unauthorized access attempt', {
			ip: request.headers.get('x-forwarded-for') || request.headers.get('host'),
			headers: Object.fromEntries(request.headers.entries()),
		});
		return response as Response;
	}

	// Validate request body
	const reqBody = await request.json();
	const parseResult = JobSearchRequestSchema.safeParse(reqBody);
	if (!parseResult.success) {
		await logger.warn('[JOBS][POST] Invalid job search payload', {
			issues: parseResult.error.issues,
			user:
				typeof user === 'object' && user !== null && 'email' in user
					? (user as any).email
					: undefined,
		});
		return NextResponse.json(
			{error: 'Invalid job search payload', details: parseResult.error.issues},
			{status: 400},
		);
	}

	// Local dev or Pi: use JobService
	if (env.isDev || (env.isProd && deployment.isPi)) {
		if (!JobService) {
			await logger.error('JobService not implemented');
			return NextResponse.json(
				{error: 'JobService not implemented'},
				{status: 501},
			);
		}
		try {
			// Pass both userId and userEmail to the service
			const userId = (user as any).userId || (user as any)._id || '';
			const userEmail = (user as any).email || '';
			const result = await JobService.searchJobs({
				...parseResult.data,
				userId,
				userEmail,
			});
			return NextResponse.json(result);
		} catch (error) {
			await logger.error('Error searching jobs', error);
			return NextResponse.json(
				{
					error: 'Error searching jobs',
					details: (error as Error).message,
				},
				{status: 500},
			);
		}
	}

	await logger.error('Job search not implemented for this environment', {
		env,
		deployment,
		user:
			typeof user === 'object' && user !== null && 'email' in user
				? (user as any).email
				: undefined,
	});
	return NextResponse.json(
		{error: 'Job search not implemented for this environment'},
		{status: 501},
	);
}
