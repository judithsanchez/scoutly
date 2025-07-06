import {Company} from '@/models/Company';
import {UserCompanyPreference} from '@/models/UserCompanyPreference';
import {ICompany, WorkModel} from '@/types/company';

export class CompanyService {
	static async getCompanyById(companyID: string) {
		return Company.findOne({companyID});
	}

	static async getAllCompanies() {
		return Company.find({});
	}

	static async createCompany(data: Partial<ICompany>) {
		const company = new Company(data);
		await company.save();
		return company;
	}

	static async updateCompany(companyID: string, data: Partial<ICompany>) {
		// Remove undefined fields to avoid overwriting with undefined
		const updateData: Record<string, any> = {};
		(Object.keys(data) as (keyof ICompany)[]).forEach(key => {
			if (data[key] !== undefined) {
				// Special handling for work_model: convert string to enum if needed
				if (key === 'work_model') {
					const val = data[key];
					if (typeof val === 'string') {
						// Accept both enum and string values, but cast string to WorkModel if possible
						if (['FULLY_REMOTE', 'HYBRID', 'IN_OFFICE'].includes(val)) {
							updateData[key] = val as WorkModel;
						}
					} else if (val !== undefined) {
						updateData[key] = val;
					}
				} else {
					updateData[key as string] = data[key];
				}
			}
		});
		const updated = await Company.findOneAndUpdate(
			{companyID},
			{$set: updateData},
			{new: true},
		);
		return updated;
	}

	static async deleteCompany(companyID: string) {
		const company = await Company.findOneAndDelete({companyID});
		if (company) {
			// Remove all user-company-preference records for this company
			await UserCompanyPreference.deleteMany({companyId: company._id});
		}
		return company;
	}
}
