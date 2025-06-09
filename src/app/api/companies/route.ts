import {NextRequest, NextResponse} from 'next/server';
import {Logger} from '@/utils/logger';
import {CompanyService} from '@/services/companyService';
import dbConnect from '@/middleware/database'; // <-- Change this import

const logger = new Logger('CompaniesAPI');

export async function GET(request: NextRequest) {
	try {
		await dbConnect(); // <-- Change this function call
		logger.info('Database connection established');

		const companies = await CompanyService.getAllCompanies();
		logger.success(`Retrieved ${companies.length} companies`);

		return NextResponse.json(companies);
	} catch (error) {
		logger.error('Failed to retrieve companies', error);
		return NextResponse.json(
			{error: 'Failed to retrieve companies'},
			{status: 500},
		);
	}
}
