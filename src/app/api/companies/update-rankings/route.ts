import {NextResponse} from 'next/server';
import {connectDB} from '@/config/database';
import {CompanyService} from '@/services/companyService';
import {UserService} from '@/services/userService';
import {UserCompanyPreferenceService} from '@/services/userCompanyPreferenceService';
import type {IUser} from '@/models/User';

export async function POST() {
	try {
		await connectDB();

		const companies = await CompanyService.getAllCompanies();
		let user = await UserService.getUserByEmail(
			process.env.DEFAULT_EMAIL || '',
		);

		let updatedCount = 0;
		let addedCount = 0;

		if (!user) {
			user = await UserService.getOrCreateUser(process.env.DEFAULT_EMAIL || '');
		}

		// Get current user preferences
		const userPreferences = await UserCompanyPreferenceService.findByUserId(
			(user._id as any).toString(),
		);

		// Get set of currently tracked company IDs (note: these are MongoDB _ids, not companyID)
		const trackedCompanyIds = new Set(
			userPreferences.map(pref => (pref.companyId as any).companyID),
		);

		for (const company of companies) {
			const isTracked = trackedCompanyIds.has(company.companyID);

			if (isTracked) {
				await UserCompanyPreferenceService.upsert(
					(user._id as any).toString(),
					company.companyID,
					{rank: 75},
				);
				updatedCount++;
			} else {
				await UserCompanyPreferenceService.upsert(
					(user._id as any).toString(),
					company.companyID,
					{rank: 75, isTracking: true},
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
