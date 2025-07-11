export const dynamic = 'force-dynamic';

import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants';
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

// // /src/app/api/jobs/route.ts

// import { NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth/next';
// import { authOptions } from '@/lib/auth';
// import { getSavedJobsForUser } from '@/services/jobService';
// import { logError } from '@/utils/logger';

// export async function GET() {
//   // 1. Get the server-side session. This is secure.
//   const session = await getServerSession(authOptions);

//   // 2. Check if the user is authenticated.
//   if (!session || !session.user?.id) {
//     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
//   }

//   try {
//     // 3. Perform the database operation.
//     const savedJobs = await getSavedJobsForUser(session.user.id);
//     return NextResponse.json(savedJobs);

//   } catch (error) {
//     // 4. Handle any errors gracefully.
//     logError('Failed to fetch saved jobs', error);
//     return NextResponse.json(
//       { message: 'An error occurred while fetching saved jobs.' },
//       { status: 500 }
//     );
//   }
// }
