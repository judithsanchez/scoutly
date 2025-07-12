export const dynamic = 'force-dynamic';
import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants/apiEndpoints';
import {CompanyService} from '@/services/companyService';
import {logger} from '@/utils/logger';
import {z} from 'zod';
import {requireAuth} from '@/utils/requireAuth';
import {proxyToBackend} from '@/utils/proxyToBackend';
import {CompaniesArrayZodSchema} from '@/schemas/companySchemas';

const querySchema = z.object({});

export async function GET(request: NextRequest): Promise<Response> {
	await logger.debug('[COMPANIES][GET] Incoming headers', {
		headers: Object.fromEntries(request.headers.entries()),
	});

	if (deployment.isVercel && env.isProd) {
		const apiUrlFull = `${apiBaseUrl.prod}${endpoint.companies.list}`;
		return proxyToBackend({
			request,
			backendUrl: apiUrlFull,
			methodOverride: 'GET',
			logPrefix: '[COMPANIES][GET][PROXY]',
		});
	}

	await logger.debug(`[COMPANIES][GET] ${endpoint.companies.list} called`, {
		env: {...env},
		deployment: {...deployment},
		headers: Object.fromEntries(request.headers.entries()),
	});

	await logger.debug('[COMPANIES][GET] Authorization header', {
		authorization: request.headers.get('Authorization'),
		AUTHORIZATION: request.headers.get('AUTHORIZATION'),
	});

	const {user, response} = await requireAuth(request);

	await logger.debug('[COMPANIES][GET] requireAuth result', {
		user,
		responseType: typeof response,
	});

	if (!user) {
		await logger.warn('[COMPANIES][GET] Unauthorized access attempt', {
			ip: request.headers.get('x-forwarded-for') || request.headers.get('host'),
			headers: Object.fromEntries(request.headers.entries()),
		});
		return response as Response;
	}

	try {
		const parseResult = querySchema.safeParse({});
		if (!parseResult.success) {
			await logger.warn('[COMPANIES][GET] Invalid query parameters', {
				issues: parseResult.error.issues,
				user:
					typeof user === 'object' && user !== null && 'email' in user
						? user.email
						: undefined,
			});
			return NextResponse.json(
				{
					error: 'Invalid query parameters',
					details: parseResult.error.issues,
				},
				{status: 400},
			);
		}
		const companies = await CompanyService.getAllCompanies();
		const companiesParse = CompaniesArrayZodSchema.safeParse(companies);
		if (!companiesParse.success) {
			await logger.error('[COMPANIES][GET] Invalid companies response shape', {
				issues: companiesParse.error.issues,
				user:
					typeof user === 'object' && user !== null && 'email' in user
						? user.email
						: undefined,
			});
			return NextResponse.json(
				{
					error: 'Invalid companies response shape',
					details: companiesParse.error.issues,
				},
				{status: 500},
			);
		}
		await logger.info('[COMPANIES][GET] Fetched companies successfully', {
			count: Array.isArray(companies) ? companies.length : undefined,
			user:
				typeof user === 'object' && user !== null && 'email' in user
					? user.email
					: undefined,
		});
		return NextResponse.json(companiesParse.data);
	} catch (error) {
		await logger.error(
			'[COMPANIES][GET] Error fetching companies from database',
			{
				error,
				user:
					typeof user === 'object' && user !== null && 'email' in user
						? user.email
						: undefined,
			},
		);
		return NextResponse.json(
			{
				error: 'Error fetching companies from database',
				details: (error as Error).message,
			},
			{status: 500},
		);
	}
}
