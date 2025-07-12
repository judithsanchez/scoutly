export const dynamic = 'force-dynamic';
import {NextRequest, NextResponse} from 'next/server';
import {env, deployment} from '@/config/environment';
import {endpoint} from '@/constants';
import {CompanyService} from '@/services/companyService';
import {logger} from '@/utils/logger';
import {z} from 'zod';

const querySchema = z.object({});

export async function GET(request: NextRequest) {
	await logger.debug(`GET ${endpoint.companies.list} called`, {
		env: {...env},
		deployment: {...deployment},
	});

	if (!deployment.isVercel) {
		try {
			const parseResult = querySchema.safeParse({});
			if (!parseResult.success) {
				await logger.warn('Invalid query parameters', {
					issues: parseResult.error.issues,
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
			return NextResponse.json(companies);
		} catch (error) {
			await logger.error('Error fetching companies from database', error);
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
