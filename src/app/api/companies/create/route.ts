export const dynamic = 'force-dynamic';
import {NextRequest, NextResponse} from 'next/server';
import {Logger} from '@/utils/logger';
import {CompanyService} from '@/services/companyService';
import dbConnect from '@/middleware/database';
import {
	CreateCompanyRequestSchema,
	CreateCompanyResponseSchema,
} from '@/schemas/companySchemas';
import {ErrorResponseSchema} from '@/schemas/userSchemas';

const logger = new Logger('AddCompanyAPI');

export async function POST(request: NextRequest) {
	try {
		await dbConnect();

		const body = await request.json();
		const parseResult = CreateCompanyRequestSchema.safeParse(body);

		if (!parseResult.success) {
			logger.warn('Invalid request body:', parseResult.error.errors);
			return NextResponse.json(
				ErrorResponseSchema.parse({
					error: 'Invalid request body',
					details: parseResult.error.errors,
				}),
				{status: 400},
			);
		}

		const companyData = parseResult.data;

		const existingCompany = await CompanyService.getCompanyById(
			companyData.companyID,
		);
		if (existingCompany) {
			return NextResponse.json(
				ErrorResponseSchema.parse({
					error: 'A company with this ID already exists',
				}),
				{status: 400},
			);
		}

		const newCompany = await CompanyService.createCompany({
			...companyData,
			work_model: companyData.work_model as any, // Fix for enum type mismatch
		});

		logger.success(
			`Created new company: ${newCompany.company} (${newCompany.companyID})`,
		);

		const obj =
			typeof newCompany.toObject === 'function'
				? newCompany.toObject()
				: newCompany;
		const serializedCompany = {
			...obj,
			_id: obj._id?.toString?.() ?? obj._id,
			lastSuccessfulScrape: obj.lastSuccessfulScrape
				? new Date(obj.lastSuccessfulScrape).toISOString()
				: undefined,
			createdAt: obj.createdAt
				? new Date(obj.createdAt as any).toISOString()
				: undefined,
			updatedAt: obj.updatedAt
				? new Date(obj.updatedAt as any).toISOString()
				: undefined,
			scrapeErrors: Array.isArray(obj.scrapeErrors)
				? obj.scrapeErrors.map((e: any) => e?.toString?.() ?? e)
				: [],
		};

		const response = CreateCompanyResponseSchema.parse({
			success: true,
			message: 'Company created successfully',
			company: serializedCompany,
		});

		return NextResponse.json(response, {status: 201});
	} catch (error: any) {
		logger.error('Error creating company:', error);

		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}
