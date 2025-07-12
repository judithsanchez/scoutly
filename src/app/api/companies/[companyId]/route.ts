import {NextRequest, NextResponse} from 'next/server';
import {CompanyService} from '@/services/companyService';
import {logger} from '@/utils/logger';
import {requireAuth} from '@/utils/requireAuth';
import {CompanyZodSchema} from '@/schemas/companySchemas';

export async function GET(
	request: NextRequest,
	{params}: {params: {companyId: string}},
): Promise<Response> {
	const {user, response} = await requireAuth(request);
	if (!user) {
		await logger.warn('[COMPANIES][GET][BY_ID] Unauthorized access attempt', {
			ip: request.headers.get('x-forwarded-for') || request.headers.get('host'),
		});
		return response as Response;
	}

	try {
		const company = await CompanyService.getCompanyById(params.companyId);
		if (!company) {
			return NextResponse.json({error: 'Company not found'}, {status: 404});
		}
		const parseResult = CompanyZodSchema.safeParse(company);
		if (!parseResult.success) {
			await logger.warn('[COMPANIES][GET][BY_ID] Invalid company shape', {
				issues: parseResult.error.issues,
				user: user.email,
			});
			return NextResponse.json(
				{error: 'Invalid company shape', details: parseResult.error.issues},
				{status: 500},
			);
		}
		return NextResponse.json(parseResult.data);
	} catch (error) {
		await logger.error('[COMPANIES][GET][BY_ID] Error fetching company', {
			error,
			user: user.email,
		});
		return NextResponse.json(
			{error: 'Error fetching company', details: (error as Error).message},
			{status: 500},
		);
	}
}
