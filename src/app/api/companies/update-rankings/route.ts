import {NextRequest, NextResponse} from 'next/server';
import dbConnect from '@/middleware/database';
import {CompanyService} from '@/services/companyService';

export async function POST(request: NextRequest) {
	await dbConnect();
	const companies = await CompanyService.getAllCompanies();
	// ... your ranking update logic here ...
	return NextResponse.json({success: true, companiesUpdated: companies.length});
}
