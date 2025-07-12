export const dynamic = 'force-dynamic';

import {NextRequest, NextResponse} from 'next/server';
import {env, deployment} from '@/config/environment';
import {endpoint} from '@/constants';
import {CompanyService} from '@/services/companyService';
import {logger} from '@/utils/logger';
import {z} from 'zod';
import {requireAuth} from '@/utils/requireAuth';

const createCompanySchema = z.object({
	companyID: z.string(),
	company: z.string(),
	careers_url: z.string().url(),
	selector: z.string(),
	work_model: z.string(),
	headquarters: z.string(),
	office_locations: z.array(z.string()),
	fields: z.array(z.string()),
	openToApplication: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
	if (deployment.isVercel) {
		return NextResponse.json({error: 'Not available on Vercel'}, {status: 403});
	}

	await logger.debug(
		`[COMPANIES][CREATE][POST] ${endpoint.companies.create} called`,
		{
			env: {...env},
			deployment: {...deployment},
			headers: Object.fromEntries(request.headers.entries()),
		},
	);

	const {user, response} = await requireAuth(request);
	if (!user) {
		await logger.warn('[COMPANIES][CREATE][POST] Unauthorized access attempt', {
			ip: request.headers.get('x-forwarded-for') || request.headers.get('host'),
		});
		return response;
	}

	if (!deployment.isVercel) {
		try {
			const reqBody = await request.json();
			const parseResult = createCompanySchema.safeParse(reqBody);

			if (!parseResult.success) {
				await logger.warn(
					'[COMPANIES][CREATE][POST] Invalid create company payload',
					{
						issues: parseResult.error.issues,
						user: user.email,
					},
				);
				return NextResponse.json(
					{
						error: 'Invalid create company payload',
						details: parseResult.error.issues,
					},
					{status: 400},
				);
			}

			const company = await CompanyService.createCompany(parseResult.data);
			await logger.info(
				'[COMPANIES][CREATE][POST] Company created successfully',
				{
					companyID: company.companyID,
					user: user.email,
				},
			);
			return NextResponse.json(company, {status: 201});
		} catch (error) {
			await logger.error('[COMPANIES][CREATE][POST] Error creating company', {
				error,
				user: user.email,
			});
			return NextResponse.json(
				{
					error: 'Error creating company',
					details: (error as Error).message,
				},
				{status: 500},
			);
		}
	}
}
