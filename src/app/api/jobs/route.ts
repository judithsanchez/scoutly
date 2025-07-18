import {corsOptionsResponse} from '@/utils/cors';

export async function OPTIONS() {
	return corsOptionsResponse('jobs');
}
export const dynamic = 'force-dynamic';

import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants';
import {JobSearchRequestSchema} from '@/schemas/jobSearchSchemas';
import {logger} from '@/utils/logger';

let JobService: any;
try {
	JobService = require('@/services/jobService').JobService;
} catch {}

export async function POST(request: NextRequest) {
	await logger.debug(`POST ${endpoint.jobs.search} called`, {
		env: {...env},
		deployment: {...deployment},
	});

	const reqBody = await request.json();
	const parseResult = JobSearchRequestSchema.safeParse(reqBody);
	if (!parseResult.success) {
		await logger.warn('[JOBS][POST] Invalid job search payload', {
			issues: parseResult.error.issues,
		});
		return NextResponse.json(
			{error: 'Invalid job search payload', details: parseResult.error.issues},
			{status: 400},
		);
	}

	if (env.isDev || (env.isProd && deployment.isPi)) {
		if (!JobService) {
			await logger.error('JobService not implemented');
			return NextResponse.json(
				{error: 'JobService not implemented'},
				{status: 501},
			);
		}
		try {
			const result = await JobService.searchJobs(parseResult.data);
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

	if (env.isProd && deployment.isVercel) {
		await logger.info(
			'Environment: Production on Vercel - proxying to backend API',
		);
		const apiUrl = apiBaseUrl.prod;
		if (!apiUrl) {
			await logger.error('Backend API URL not configured');
			return NextResponse.json(
				{error: 'Backend API URL not configured'},
				{status: 500},
			);
		}
		try {
			await logger.debug('Proxying job search to backend API', {
				url: `${apiUrl}${endpoint.jobs.search}`,
			});
			const response = await fetch(`${apiUrl}${endpoint.jobs.search}`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify(reqBody),
			});
			const data = await response.json();
			if (!response.ok) {
				await logger.error('Failed to search jobs via backend API', {
					status: response.status,
				});
				return NextResponse.json(
					{error: data.error || 'Failed to search jobs via backend API'},
					{status: response.status},
				);
			}
			await logger.info('Job search completed via backend API');
			return NextResponse.json(data);
		} catch (error) {
			await logger.error('Error connecting to backend API', error);
			return NextResponse.json(
				{
					error: 'Error connecting to backend API',
					details: (error as Error).message,
				},
				{status: 500},
			);
		}
	}
}
