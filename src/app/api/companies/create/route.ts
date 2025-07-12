import {NextRequest, NextResponse} from 'next/server';
import {CompanyService} from '@/services/companyService';
import {logger} from '@/utils/logger';
import {requireAuth} from '@/utils/requireAuth';
import {CompanyZodSchema} from '@/schemas/companySchemas';
import {WorkModel} from '@/types/company';

export async function POST(request: NextRequest): Promise<Response> {
	const {user, response} = await requireAuth(request);
	if (!user) {
		await logger.warn('[COMPANIES][CREATE][POST] Unauthorized access attempt', {
			ip: request.headers.get('x-forwarded-for') || request.headers.get('host'),
		});
		return response as Response;
	}

	try {
		const body = await request.json();
		const parseResult = CompanyZodSchema.safeParse(body);
		if (!parseResult.success) {
			await logger.warn('[COMPANIES][CREATE][POST] Invalid company payload', {
				issues: parseResult.error.issues,
				user:
					typeof user === 'object' && user !== null && 'email' in user
						? user.email
						: undefined,
			});
			return NextResponse.json(
				{error: 'Invalid company payload', details: parseResult.error.issues},
				{status: 400},
			);
		}

		const companyData = {
			...parseResult.data,
			work_model:
				typeof parseResult.data.work_model === 'string'
					? WorkModel[parseResult.data.work_model as keyof typeof WorkModel]
					: parseResult.data.work_model,
		};

		const company = await CompanyService.createCompany(companyData);
		await logger.info('[COMPANIES][CREATE][POST] Company created', {
			companyID: company.companyID,
			user:
				typeof user === 'object' && user !== null && 'email' in user
					? user.email
					: undefined,
		});
		return NextResponse.json(company, {status: 201});
	} catch (error) {
		await logger.error('[COMPANIES][CREATE][POST] Error creating company', {
			error,
			user:
				typeof user === 'object' && user !== null && 'email' in user
					? user.email
					: undefined,
		});
		return NextResponse.json(
			{error: 'Error creating company', details: (error as Error).message},
			{status: 500},
		);
	}
}
