import {NextRequest, NextResponse} from 'next/server';
import {CompanyService} from '@/services/companyService';
import dbConnect from '@/middleware/database';
import {
	CompanySchema,
	CreateCompanyRequestSchema,
} from '@/schemas/companySchemas';
import {ErrorResponseSchema} from '@/schemas/userSchemas';

// PATCH /api/companies/[companyId] - Edit company info (partial update)
export async function PATCH(
	request: NextRequest,
	{params}: {params: {companyId: string}},
) {
	try {
		await dbConnect();
		const {companyId} = params;
		const body = await request.json();

		// Validate partial update (allow any subset of company fields except _id)
		const parseResult = CreateCompanyRequestSchema.partial().safeParse(body);
		if (!parseResult.success) {
			return NextResponse.json(
				ErrorResponseSchema.parse({
					error: 'Invalid request body',
					details: parseResult.error.errors,
				}),
				{status: 400},
			);
		}

		// Fix work_model type for update
		const updateData = {
			...parseResult.data,
			...(parseResult.data.work_model && {
				work_model: parseResult.data.work_model as any,
			}),
		};

		const updated = await CompanyService.updateCompany(companyId, updateData);
		if (!updated) {
			return NextResponse.json(
				ErrorResponseSchema.parse({error: 'Company not found'}),
				{status: 404},
			);
		}

		// Serialize for Zod
		const obj =
			typeof updated.toObject === 'function' ? updated.toObject() : updated;
		const serialized = {
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

		return NextResponse.json(CompanySchema.parse(serialized));
	} catch (error: any) {
		return NextResponse.json(
			ErrorResponseSchema.parse({
				error: error.message || 'Internal server error',
			}),
			{status: 500},
		);
	}
}

// DELETE /api/companies/[companyId] - Remove company and cascade delete user-company-preferences
export async function DELETE(
	request: NextRequest,
	{params}: {params: {companyId: string}},
) {
	try {
		await dbConnect();
		const {companyId} = params;

		const companyDoc = await CompanyService.getCompanyById(companyId);
		if (!companyDoc) {
			return NextResponse.json(
				ErrorResponseSchema.parse({error: 'Company not found'}),
				{status: 404},
			);
		}

		// Remove company
		await CompanyService.deleteCompany(companyId);

		// Cascade delete user-company-preferences
		const {UserCompanyPreference} = await import(
			'@/models/UserCompanyPreference'
		);
		await UserCompanyPreference.deleteMany({companyId: companyDoc._id});

		return NextResponse.json({
			success: true,
			message: 'Company and related preferences deleted',
		});
	} catch (error: any) {
		return NextResponse.json(
			ErrorResponseSchema.parse({
				error: error.message || 'Internal server error',
			}),
			{status: 500},
		);
	}
}
