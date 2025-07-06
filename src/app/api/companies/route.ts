import {NextRequest, NextResponse} from 'next/server';
import dbConnect from '@/middleware/database';
import {CompanyService} from '@/services/companyService';

export async function GET(request: NextRequest) {
	await dbConnect();
	const companies = await CompanyService.getAllCompanies();
	return NextResponse.json(companies);
}
