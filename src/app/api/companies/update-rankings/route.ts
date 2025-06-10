import {NextResponse} from 'next/server';
import {connectDB} from '@/config/database';
import {CompanyService} from '@/services/companyService';

export async function POST() {
	try {
		await connectDB();

		// Get all companies
		const companies = await CompanyService.getAllCompanies();

		// Update each company's ranking to 75
		for (const company of companies) {
			await CompanyService.updateCompanyRanking(company.companyID, 75);
		}

		return NextResponse.json({
			success: true,
			message: `Successfully updated ${companies.length} companies to ranking 75`,
		});
	} catch (error: any) {
		return NextResponse.json(
			{
				success: false,
				error: error.message,
			},
			{status: 500},
		);
	}
}
