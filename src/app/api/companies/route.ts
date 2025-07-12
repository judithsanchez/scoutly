export const dynamic = 'force-dynamic';
import {NextRequest, NextResponse} from 'next/server';
import {env, deployment} from '@/config/environment';
import {endpoint} from '@/constants';
import {CompanyService} from '@/services/companyService';
import {logger} from '@/utils/logger';
import {z} from 'zod';
import {requireAuth} from '@/utils/requireAuth';

const querySchema = z.object({});

export async function GET(request: NextRequest) {
	if (deployment.isVercel) {
		return NextResponse.json({error: 'Not available on Vercel'}, {status: 403});
	}

	await logger.debug(`[COMPANIES][GET] ${endpoint.companies.list} called`, {
		env: {...env},
		deployment: {...deployment},
		headers: Object.fromEntries(request.headers.entries()),
	});

	const {user, response} = await requireAuth(request);
	if (!user) {
		await logger.warn('[COMPANIES][GET] Unauthorized access attempt', {
			ip: request.headers.get('x-forwarded-for') || request.headers.get('host'),
		});
		return response;
	}

	if (!deployment.isVercel) {
		try {
			const parseResult = querySchema.safeParse({});
			if (!parseResult.success) {
				await logger.warn('[COMPANIES][GET] Invalid query parameters', {
					issues: parseResult.error.issues,
					user: user.email,
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
			await logger.info('[COMPANIES][GET] Fetched companies successfully', {
				count: Array.isArray(companies) ? companies.length : undefined,
				user: user.email,
			});
			return NextResponse.json(companies);
		} catch (error) {
			await logger.error(
				'[COMPANIES][GET] Error fetching companies from database',
				{
					error,
					user: user.email,
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
}
