import {User} from '@/models/User';
import {AdminUserService} from '@/services/adminUserService';
import {CompanyScrapeHistory} from '@/models/CompanyScrapeHistory';
import {Log} from '@/models/Log';
import {connectDB} from '@/config/database';
import {companies, CompanySeed} from '@/data/companies';
import {CompanyService} from '@/services/companyService';

export class AdminService {
	/**
	 * Checks if a user is an admin by email (using AdminUser collection)
	 */
	static async isUserAdmin(email: string) {
		await connectDB();
		return AdminUserService.isAdmin(email);
	}
	static async getCompanyScrapeHistory({page = 1, pageSize = 20} = {}) {
		await connectDB();
		const skip = (page - 1) * pageSize;
		const total = await CompanyScrapeHistory.countDocuments();
		const records = await CompanyScrapeHistory.find()
			.sort({lastScrapeDate: -1})
			.skip(skip)
			.limit(pageSize)
			.lean();
		return {total, page, pageSize, records};
	}

	static async getLogs({page = 1, pageSize = 20} = {}) {
		await connectDB();
		const skip = (page - 1) * pageSize;
		const total = await Log.countDocuments();
		const records = await Log.find()
			.sort({timestamp: -1})
			.skip(skip)
			.limit(pageSize)
			.lean();
		return {total, page, pageSize, records};
	}
	static async seedCompanies() {
		let added = 0;
		let skipped = 0;
		for (const company of companies as CompanySeed[]) {
			// Check if company with this companyID already exists
			const exists = await CompanyService.getCompanyById(company.companyID);
			if (!exists) {
				await CompanyService.createCompany(company);
				added++;
			} else {
				skipped++;
			}
		}
		return {
			message: `Seeded ${added} new companies. Skipped ${skipped} existing companies.`,
			added,
			skipped,
		};
	}
}
