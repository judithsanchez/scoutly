export const dynamic = 'force-dynamic';
import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants';
import {logger} from '@/utils/logger';
import {z} from 'zod';

let UserService: any;
try {
	UserService = require('@/services/userService').UserService;
} catch {}

// --- Zod Schemas ---

const SavedJobSchema = z.object({
	_id: z.string(),
	userId: z.string().optional(),
	jobId: z.string().optional(),
	companyId: z.string().optional(),
	status: z.string(),
	title: z.string(),
	url: z.string(),
	goodFitReasons: z.array(z.string()).optional(),
	considerationPoints: z.array(z.string()).optional(),
	stretchGoals: z.array(z.string()).optional(),
	suitabilityScore: z.number().optional(),
	location: z.string().optional(),
	techStack: z.array(z.string()).optional(),
	experienceLevel: z.string().optional(),
	languageRequirements: z.array(z.string()).optional(),
	visaSponsorshipOffered: z.boolean().optional(),
	relocationAssistanceOffered: z.boolean().optional(),
	notes: z.string().optional(),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional(),
	__v: z.number().optional(),
	salary: z.record(z.any()).optional(),
});

const UserSchema = z.object({
	_id: z.string(),
	email: z.string(),
	cvUrl: z.string().optional(),
	candidateInfo: z.record(z.any()).optional(),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional(),
	__v: z.number().optional(),
	savedJobs: z.array(SavedJobSchema).optional(),
});

export async function POST(request: NextRequest) {
	await logger.debug(`POST ${endpoint.users.query} called`, {
		env: {...env},
		deployment: {...deployment},
	});

	const {email} = await request.json();

	if (!email) {
		return NextResponse.json({error: 'Email is required.'}, {status: 400});
	}

	if (env.isDev || (env.isProd && deployment.isPi)) {
		if (!UserService) {
			await logger.error('UserService not implemented');
			return NextResponse.json(
				{error: 'UserService not implemented'},
				{status: 501},
			);
		}
		try {
			const user = await UserService.getUserByEmail(email);
			if (user) {
				const parsed = UserSchema.parse(user);
				return NextResponse.json({user: parsed});
			}
			return NextResponse.json({error: 'User not found'}, {status: 404});
		} catch (error: any) {
			await logger.error('Error fetching user by email', error);
			return NextResponse.json(
				{
					error: error.errors
						? JSON.stringify(error.errors, null, 2)
						: error.message || 'Internal server error',
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
			await logger.debug('Proxying user query to backend API', {
				url: `${apiUrl}${endpoint.users.query}`,
			});
			const response = await fetch(`${apiUrl}${endpoint.users.query}`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({email}),
			});
			const data = await response.json();
			if (!response.ok) {
				await logger.error('Failed to query user via backend API', {
					status: response.status,
				});
				return NextResponse.json(
					{error: data.error || 'Failed to query user via backend API'},
					{status: response.status},
				);
			}
			if (data.user) {
				const parsed = UserSchema.parse(data.user);
				return NextResponse.json({user: parsed});
			}
			return NextResponse.json(data);
		} catch (error: any) {
			await logger.error('Error connecting to backend API', error);
			return NextResponse.json(
				{
					error: error.errors
						? JSON.stringify(error.errors, null, 2)
						: error.message || 'Internal server error',
				},
				{status: 500},
			);
		}
	}
}
