import {NextRequest, NextResponse} from 'next/server';
import {Logger} from '@/utils/logger';
import {CompanyService} from '@/services/companyService';
import dbConnect from '@/middleware/database';

const logger = new Logger('AddCompanyAPI');

export async function POST(request: NextRequest) {
	try {
		await dbConnect();

		const companyData = await request.json();

		const requiredFields = [
			'companyID',
			'company',
			'careers_url',
			'work_model',
			'headquarters',
			'fields',
		];
		for (const field of requiredFields) {
			if (!companyData[field]) {
				return NextResponse.json(
					{error: `Missing required field: ${field}`},
					{status: 400},
				);
			}
		}

		const existingCompany = await CompanyService.getCompanyById(
			companyData.companyID,
		);
		if (existingCompany) {
			return NextResponse.json(
				{error: 'A company with this ID already exists'},
				{status: 400},
			);
		}

		const newCompany = await CompanyService.createCompany(companyData);

		logger.success(
			`Created new company: ${newCompany.company} (${newCompany.companyID})`,
		);

		return NextResponse.json(
			{
				success: true,
				message: 'Company created successfully',
				company: newCompany,
			},
			{status: 201},
		);
	} catch (error: any) {
		logger.error('Error creating company:', error);

		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}
