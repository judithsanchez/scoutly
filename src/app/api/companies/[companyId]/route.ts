import {NextRequest, NextResponse} from 'next/server';
import dbConnect from '@/middleware/database';
import {CompanyService} from '@/services/companyService';
import {getServerSession} from 'next-auth/next';
import {authOptions} from '@/lib/auth';
import {ErrorResponseSchema} from '@/schemas/userSchemas';
import {CreateCompanyRequestSchema} from '@/schemas/companySchemas';
import {WorkModel} from '@/types/company';

// Helper to check admin
async function requireAdmin(request: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.isAdmin) {
		return NextResponse.json(
			ErrorResponseSchema.parse({error: 'Admin access required'}),
			{status: 403},
		);
	}
	return null;
}

// PATCH: Update company details (admin only)
export async function PATCH(
	request: NextRequest,
	{params}: {params: {companyId: string}},
) {
	const adminCheck = await requireAdmin(request);
	if (adminCheck) return adminCheck;

	await dbConnect();
	const {companyId} = params;
	const body = await request.json();

	// Validate input (allow partial update)
	const safe = CreateCompanyRequestSchema.partial().safeParse(body);
	if (!safe.success) {
		return NextResponse.json(
			ErrorResponseSchema.parse({
				error: 'Invalid request body',
				details: safe.error.errors,
			}),
			{status: 400},
		);
	}

	// Fix work_model type if needed
	const patchData: any = {...safe.data};
	if (
		patchData.work_model &&
		typeof patchData.work_model === 'string' &&
		!Object.values(WorkModel).includes(patchData.work_model as WorkModel)
	) {
		// Try to map string to enum value
		if (
			patchData.work_model === 'FULLY_REMOTE' ||
			patchData.work_model === 'HYBRID' ||
			patchData.work_model === 'IN_OFFICE'
		) {
			patchData.work_model = patchData.work_model as WorkModel;
		} else {
			patchData.work_model = undefined;
		}
	}

	// Remove work_model if not a valid enum value
	if (
		patchData.work_model &&
		!Object.values(WorkModel).includes(patchData.work_model as WorkModel)
	) {
		delete patchData.work_model;
	}

	const updated = await CompanyService.updateCompany(companyId, patchData);
	if (!updated) {
		return NextResponse.json(
			ErrorResponseSchema.parse({error: 'Company not found'}),
			{status: 404},
		);
	}

	return NextResponse.json({success: true, company: updated});
}

// DELETE: Remove company (admin only)
export async function DELETE(
	request: NextRequest,
	{params}: {params: {companyId: string}},
) {
	const adminCheck = await requireAdmin(request);
	if (adminCheck) return adminCheck;

	await dbConnect();
	const {companyId} = params;

	const deleted = await CompanyService.deleteCompany(companyId);
	if (!deleted) {
		return NextResponse.json(
			ErrorResponseSchema.parse({error: 'Company not found'}),
			{status: 404},
		);
	}

	return NextResponse.json({success: true});
}
