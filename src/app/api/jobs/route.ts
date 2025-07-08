export const dynamic = 'force-dynamic';

import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants';
import {logger} from '@/utils/logger';

let JobService: any;
try {
	JobService = require('@/services/jobService').JobService;
} catch {}

// POST /api/jobs
export async function POST(request: NextRequest) {
	await logger.debug(`POST ${endpoint.jobs.search} called`, {
		env: {...env},
		deployment: {...deployment},
	});

	const reqBody = await request.json();

	if (env.isDev || (env.isProd && deployment.isPi)) {
		if (!JobService) {
			await logger.error('JobService not implemented');
			return NextResponse.json(
				{error: 'JobService not implemented'},
				{status: 501},
			);
		}
		try {
			const result = await JobService.searchJobs(reqBody);
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

/**
 * @openapi
 * /api/jobs:
 *   post:
 *     summary: Run AI-powered job matching for a candidate across selected companies.
 *     description: |
 *       Given a user's credentials, a list of company IDs, a CV URL, and candidate info, this endpoint orchestrates an AI-powered job matching workflow for each company.
 *       Returns a list of results per company, each containing an array of matched jobs and analysis details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               credentials:
 *                 type: object
 *                 properties:
 *                   gmail:
 *                     type: string
 *                     description: User's email address.
 *                 required:
 *                   - gmail
 *               companyIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of company IDs to match against.
 *               cvUrl:
 *                 type: string
 *                 description: Publicly accessible URL to the candidate's CV.
 *               candidateInfo:
 *                 type: object
 *                 description: Candidate profile information.
 *             required:
 *               - credentials
 *               - companyIds
 *               - cvUrl
 *               - candidateInfo
 *     responses:
 *       200:
 *         description: Job matching results per company.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JobMatchingResponse'
 *       400:
 *         description: Validation error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: array
 *                   items:
 *                     type: string
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
