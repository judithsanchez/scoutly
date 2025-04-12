import {NextRequest, NextResponse} from 'next/server';
import {Logger} from '@/utils/logger';
import {CompanyService} from '@/services/companyService';
import {connectDB} from '@/config/database';

const logger = new Logger('CompaniesAPI');

export async function GET(request: NextRequest) {
	try {
		await connectDB();
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
