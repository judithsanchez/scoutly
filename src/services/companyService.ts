import {Company} from '@/models/Company';
import {UserCompanyPreference} from '@/models/UserCompanyPreference';
import {ICompany, WorkModel} from '@/types/company';
import {connectDB} from '@/config/database';
import mongoose from 'mongoose';

export class CompanyService {
	static async getCompanyById(id: string) {
		await connectDB();
		if (!mongoose.Types.ObjectId.isValid(id)) return null;
		return Company.findById(id);
	}

	static async getAllCompanies() {
		await connectDB();
		return Company.find({});
	}

	static async createCompany(data: Partial<ICompany>) {
		await connectDB();
		const company = new Company(data);
		await company.save();
		return company;
	}

	static async updateCompany(id: string, data: Partial<ICompany>) {
		await connectDB();
		if (!mongoose.Types.ObjectId.isValid(id)) return null;
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
		const updated = await Company.findByIdAndUpdate(
			id,
			{$set: updateData},
			{new: true},
		);
		return updated;
	}

	static async deleteCompany(id: string) {
		await connectDB();
		if (!mongoose.Types.ObjectId.isValid(id)) return null;
		const company = await Company.findByIdAndDelete(id);
		if (company) {
			// Remove all user-company-preference records for this company
			await UserCompanyPreference.deleteMany({companyId: company._id});
		}
		return company;
	}
}
