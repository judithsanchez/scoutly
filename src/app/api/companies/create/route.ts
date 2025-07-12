export const dynamic = 'force-dynamic';

import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants/apiEndpoints';
import {CompanyService} from '@/services/companyService';
import {logger} from '@/utils/logger';
import {requireAuth} from '@/utils/requireAuth';
import {proxyToBackend} from '@/utils/proxyToBackend';
import {
	CreateCompanyRequestSchema,
	CompanySchema,
} from '@/schemas/companySchemas';
import {ICompany} from '@/types/company';
import {getUserEmail, toWorkModel} from '@/utils/typeHelpers';

export async function POST(request: NextRequest) {
	if (deployment.isVercel && env.isProd) {
		const apiUrlFull = `${apiBaseUrl.prod}${endpoint.companies.create}`;
		return proxyToBackend({
			request,
			backendUrl: apiUrlFull,
			methodOverride: 'POST',
			logPrefix: '[COMPANIES][CREATE][PROXY]',
		});
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
	const userEmail = getUserEmail(user);
	if (!user) {
		await logger.warn('[COMPANIES][CREATE][POST] Unauthorized access attempt', {
			ip: request.headers.get('x-forwarded-for') || request.headers.get('host'),
		});
		return response;
	}

	if (!deployment.isVercel) {
		try {
			const reqBody = await request.json();
			const parseResult = CreateCompanyRequestSchema.safeParse(reqBody);

			if (!parseResult.success) {
				await logger.warn(
					'[COMPANIES][CREATE][POST] Invalid create company payload',
					{
						issues: parseResult.error.issues,
						user: userEmail,
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

			const transformedData = {
				...parseResult.data,
				work_model: toWorkModel(parseResult.data.work_model),
			};

			const companyParse = CompanySchema.safeParse(transformedData);
			if (!companyParse.success) {
				await logger.warn(
					'[COMPANIES][CREATE][POST] Invalid company shape after transform',
					{
						issues: companyParse.error.issues,
						user: userEmail,
					},
				);
				return NextResponse.json(
					{
						error: 'Invalid company shape after transform',
						details: companyParse.error.issues,
					},
					{status: 400},
				);
			}

			const company = await CompanyService.createCompany(
				companyParse.data as Partial<ICompany>,
			);
			await logger.info(
				'[COMPANIES][CREATE][POST] Company created successfully',
				{
					companyID: company.companyID,
					user: userEmail,
				},
			);
			return NextResponse.json(company, {status: 201});
		} catch (error) {
			await logger.error('[COMPANIES][CREATE][POST] Error creating company', {
				error,
				user: userEmail,
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
