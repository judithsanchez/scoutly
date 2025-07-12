export const dynamic = 'force-dynamic';
import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants';
import {logger} from '@/utils/logger';

let SavedJobService: any;
try {
	SavedJobService = require('@/services/savedJobService').SavedJobService;
} catch {}

export const GET = async (request: NextRequest) => {
	await logger.debug(`GET ${endpoint.jobs.saved} called`, {
		env: {...env},
		deployment: {...deployment},
	});

	const url = new URL(request.url);
	const email = url.searchParams.get('email');

	if (env.isDev || (env.isProd && deployment.isPi)) {
		if (!SavedJobService) {
			await logger.error('SavedJobService not implemented');
			return NextResponse.json(
				{error: 'SavedJobService not implemented'},
				{status: 501},
			);
		}
		try {
			const jobs = email
				? await SavedJobService.getSavedJobsByEmail(email)
				: await SavedJobService.getAllSavedJobs();
			return NextResponse.json({jobs});
		} catch (error) {
			await logger.error('Error fetching saved jobs', error);
			return NextResponse.json(
				{
					error: 'Error fetching saved jobs',
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
		let apiUrlFull = `${apiUrl}${endpoint.jobs.saved}`;
		if (email) {
			apiUrlFull += `?email=${encodeURIComponent(email)}`;
		}
		try {
			await logger.debug('Proxying get saved jobs to backend API', {
				url: apiUrlFull,
			});
			const res = await fetch(apiUrlFull, {
				method: 'GET',
				headers: {'Content-Type': 'application/json'},
			});
			const data = await res.json();
			return NextResponse.json(data, {status: res.status});
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
};

// --- PATCH: Update status of a saved job ---
export const PATCH = async (request: NextRequest) => {
	await logger.debug(`PATCH ${endpoint.jobs.saved} called`, {
		env: {...env},
		deployment: {...deployment},
	});

	const url = new URL(request.url);
	const id = url.searchParams.get('id');
	const body = await request.json();

	if (!id) {
		return NextResponse.json(
			{error: 'SavedJob id is required as query param.'},
			{status: 400},
		);
	}

	if (env.isDev || (env.isProd && deployment.isPi)) {
		if (!SavedJobService) {
			await logger.error('SavedJobService not implemented');
			return NextResponse.json(
				{error: 'SavedJobService not implemented'},
				{status: 501},
			);
		}
		try {
			const job = await SavedJobService.updateSavedJobStatus(id, body.status);
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
			await logger.debug('Proxying patch saved job to backend API', {
				url: `${apiUrl}${endpoint.jobs.saved}?id=${encodeURIComponent(id)}`,
			});
			const res = await fetch(
				`${apiUrl}${endpoint.jobs.saved}?id=${encodeURIComponent(id)}`,
				{
					method: 'PATCH',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(body),
				},
			);
			const data = await res.json();
			return NextResponse.json(data, {status: res.status});
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
};

// --- POST: Create a new saved job ---
export const POST = async (request: NextRequest) => {
	await logger.debug(`POST ${endpoint.jobs.saved} called`, {
		env: {...env},
		deployment: {...deployment},
	});

	const body = await request.json();

	if (env.isDev || (env.isProd && deployment.isPi)) {
		if (!SavedJobService) {
			await logger.error('SavedJobService not implemented');
			return NextResponse.json(
				{error: 'SavedJobService not implemented'},
				{status: 501},
			);
		}
		try {
			const job = await SavedJobService.createSavedJob(body);
			return NextResponse.json({job});
		} catch (error) {
			await logger.error('Error creating saved job', error);
			return NextResponse.json(
				{
					error: 'Error creating saved job',
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
			await logger.debug('Proxying create saved job to backend API', {
				url: `${apiUrl}${endpoint.jobs.saved}`,
			});
			const res = await fetch(`${apiUrl}${endpoint.jobs.saved}`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify(body),
			});
			const data = await res.json();
			return NextResponse.json(data, {status: res.status});
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
};

/**
 * --- Postman Manual Test Instructions ---
 *
 * GET http://localhost:3000/api/jobs/saved
 *   - Method: GET
 *   - No query params: returns ALL saved jobs
 *   - Response: { jobs: [ ... ] }
 *
 * GET http://localhost:3000/api/jobs/saved?email=YOUR_EMAIL
 *   - Method: GET
 *   - Query param: email (optional)
 *   - Example: http://localhost:3000/api/jobs/saved?email=judithv.sanchezc@gmail.com
 *   - Response: { jobs: [ ... ] }
 *
 * PATCH http://localhost:3000/api/jobs/saved?id=JOB_ID
 *   - Method: PATCH
 *   - Query param: id (required)
 *   - Body: { "status": "NEW_STATUS" }
 *   - Example: PATCH http://localhost:3000/api/jobs/saved?id=686ad9f62f274570a4b0aa63
 *   - Body: { "status": "APPLIED" }
 *   - Response: { job: { ... } }
 *   - If id is missing or not found, returns 400/404.
 *
 * POST http://localhost:3000/api/jobs/saved
 *   - Method: POST
 *   - Body: {
 *       "userId": "USER_ID",
 *       "jobId": "JOB_ID",
 *       "companyId": "COMPANY_ID", // optional
 *       "status": "WANT_TO_APPLY",
 *       "title": "Job Title",
 *       "url": "https://job.url",
 *       ...other fields as needed...
 *     }
 *   - Response: { job: { ... } }
 *   - All required fields must be present and valid.
 */
