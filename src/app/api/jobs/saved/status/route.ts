// --- CORS OPTIONS handler ---

import { corsOptionsResponse } from '@/utils/cors';

export async function OPTIONS() {
  return corsOptionsResponse('jobs/saved/status');
}

export const dynamic = 'force-dynamic';

import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants';
import {logger} from '@/utils/logger';

let SavedJobService: any;
try {
	SavedJobService = require('@/services/savedJobService').SavedJobService;
} catch {}

// PATCH /api/jobs/saved/status
export async function PATCH(request: NextRequest) {
	await logger.debug(`PATCH ${endpoint.jobs.saved_status} called`, {
		env: {...env},
		deployment: {...deployment},
	});

	const reqBody = await request.json();

	if (env.isDev || (env.isProd && deployment.isPi)) {
		if (!SavedJobService) {
			await logger.error('SavedJobService not implemented');
			return NextResponse.json(
				{error: 'SavedJobService not implemented'},
				{status: 501},
			);
		}
		try {
			const {id, status} = reqBody;
			if (!id || !status) {
				return NextResponse.json(
					{error: 'id and status are required in body'},
					{status: 400},
				);
			}
			const job = await SavedJobService.updateSavedJobStatus(id, status);
			return NextResponse.json({job});
		} catch (error) {
			await logger.error('Error updating saved job status', error);
			return NextResponse.json(
				{
					error: 'Error updating saved job status',
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
			await logger.debug('Proxying patch saved job status to backend API', {
				url: `${apiUrl}${endpoint.jobs.saved_status}`,
			});
			const response = await fetch(`${apiUrl}${endpoint.jobs.saved_status}`, {
				method: 'PATCH',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify(reqBody),
			});
			const data = await response.json();
			if (!response.ok) {
				await logger.error(
					'Failed to update saved job status via backend API',
					{
						status: response.status,
					},
				);
				return NextResponse.json(
					{
						error:
							data.error || 'Failed to update saved job status via backend API',
					},
					{status: response.status},
				);
			}
			await logger.info('Saved job status updated via backend API');
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

// GET /api/jobs/saved/status
export async function GET(request: NextRequest) {
	await logger.debug(`GET ${endpoint.jobs.saved_status} called`, {
		env: {...env},
		deployment: {...deployment},
	});

	const url = new URL(request.url);
	const id = url.searchParams.get('id');

	if (env.isDev || (env.isProd && deployment.isPi)) {
		if (!SavedJobService) {
			await logger.error('SavedJobService not implemented');
			return NextResponse.json(
				{error: 'SavedJobService not implemented'},
				{status: 501},
			);
		}
		try {
			if (!id) {
				return NextResponse.json(
					{error: 'id is required as query param'},
					{status: 400},
				);
			}
			const job = await SavedJobService.getSavedJobById(id);
			return NextResponse.json({job});
		} catch (error) {
			await logger.error('Error fetching saved job by id', error);
			return NextResponse.json(
				{
					error: 'Error fetching saved job by id',
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
		let backendUrl = `${apiUrl}${endpoint.jobs.saved_status}`;
		if (request.url.includes('?')) {
			backendUrl += request.url.substring(request.url.indexOf('?'));
		}
		try {
			await logger.debug('Proxying get saved job status to backend API', {
				url: backendUrl,
			});
			const response = await fetch(backendUrl, {
				method: 'GET',
				headers: {'Content-Type': 'application/json'},
			});
			const data = await response.json();
			if (!response.ok) {
				await logger.error('Failed to fetch saved job status via backend API', {
					status: response.status,
				});
				return NextResponse.json(
					{
						error:
							data.error || 'Failed to fetch saved job status via backend API',
					},
					{status: response.status},
				);
			}
			await logger.info('Saved job status fetched via backend API');
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
