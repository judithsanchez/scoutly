import {NextResponse} from 'next/server';
import {connectDB} from '@/config/database';
import {CompanyService} from '@/services/companyService';
import {UserService} from '@/services/userService';

export async function POST() {
	try {
		await connectDB();

		const companies = await CompanyService.getAllCompanies();
		const user = await UserService.getUserByEmail(
			process.env.DEFAULT_EMAIL || '',
		);

		let updatedCount = 0;
		let addedCount = 0;

		if (!user) {
			await UserService.getOrCreateUser(process.env.DEFAULT_EMAIL || '');
		}

		for (const company of companies) {
			const isTracked = user?.trackedCompanies?.some(
				tc => tc.companyID === company.companyID,
			);

			if (isTracked) {
				await UserService.updateTrackedCompanyRanking(
					process.env.DEFAULT_EMAIL || '',
					company.companyID,
					75,
				);
				updatedCount++;
			} else {
				await UserService.addTrackedCompany(
					process.env.DEFAULT_EMAIL || '',
					company.companyID,
					75,
				);
				addedCount++;
			}
		}

		return NextResponse.json({
			success: true,
			message: `Successfully processed ${companies.length} companies (${updatedCount} updated, ${addedCount} added) with ranking 75`,
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
