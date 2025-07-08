import {CompanyService} from '@/services/companyService';
import {companies, CompanySeed} from '@/data/companies';

export class AdminService {
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
