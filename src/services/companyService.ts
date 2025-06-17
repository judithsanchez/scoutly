import {Company, ICompany, WorkModel} from '../models/Company';

export class CompanyService {
	static async createCompany(
		companyData: Partial<ICompany>,
	): Promise<ICompany> {
		try {
			const company = new Company(companyData);
			return await company.save();
		} catch (error: any) {
			throw new Error(`Error creating company: ${error.message}`);
		}
	}

	static async getCompanyById(companyID: string): Promise<ICompany | null> {
		try {
			return await Company.findOne({companyID});
		} catch (error: any) {
			throw new Error(`Error fetching company: ${error.message}`);
		}
	}

	static async getAllCompanies(): Promise<ICompany[]> {
		try {
			return await Company.find().exec();
		} catch (error: any) {
			if (error.name === 'MongooseError' || error.name === 'MongoError') {
				throw new Error('Database connection error. Please try again later.');
			}
			throw new Error(`Error fetching companies: ${error.message}`);
		}
	}

	static async updateCompany(
		companyID: string,
		updateData: Partial<ICompany>,
	): Promise<ICompany | null> {
		try {
			return await Company.findOneAndUpdate(
				{companyID},
				{$set: updateData},
				{new: true},
			);
		} catch (error: any) {
			throw new Error(`Error updating company: ${error.message}`);
		}
	}

	static async deleteMany(): Promise<boolean> {
		try {
			await Company.deleteMany({});
			return true;
		} catch (error: any) {
			throw new Error(`Error deleting all companies: ${error.message}`);
		}
	}

	static async deleteCompany(companyID: string): Promise<boolean> {
		try {
			const result = await Company.deleteOne({companyID});
			return result.deletedCount > 0;
		} catch (error: any) {
			throw new Error(`Error deleting company: ${error.message}`);
		}
	}

	static async bulkCreateCompanies(
		companies: Array<{
			companyID: string;
			company: string;
			careers_url: string;
			selector?: string;
			work_model: WorkModel;
			headquarters: string;
			office_locations: string[];
			fields: string[];
			openToApplication?: boolean;
		}>,
	): Promise<ICompany[]> {
		try {
			const result = await Company.insertMany(companies);
			return result as unknown as ICompany[];
		} catch (error: any) {
			throw new Error(`Error bulk creating companies: ${error.message}`);
		}
	}

	static async findCompaniesByField(field: string): Promise<ICompany[]> {
		try {
			return await Company.find({fields: field});
		} catch (error: any) {
			throw new Error(`Error finding companies by field: ${error.message}`);
		}
	}

	static async findCompaniesByWorkModel(
		workModel: WorkModel,
	): Promise<ICompany[]> {
		try {
			return await Company.find({work_model: workModel});
		} catch (error: any) {
			throw new Error(
				`Error finding companies by work model: ${error.message}`,
			);
		}
	}

	static async findCompaniesByLocation(location: string): Promise<ICompany[]> {
		try {
			return await Company.find({
				$or: [
					{headquarters: {$regex: location, $options: 'i'}},
					{office_locations: {$regex: location, $options: 'i'}},
				],
			});
		} catch (error: any) {
			throw new Error(`Error finding companies by location: ${error.message}`);
		}
	}

	static async findCompaniesByName(names: string[]): Promise<ICompany[]> {
		try {
			// Create OR conditions for each name
			const orConditions = names.flatMap(name => [
				// Exact match on companyID (case insensitive)
				{companyID: new RegExp(`^${name}$`, 'i')},
				// Partial match on company name (case insensitive)
				{company: new RegExp(name, 'i')},
			]);

			return await Company.find({
				$or: orConditions,
			});
		} catch (error: any) {
			throw new Error(`Error finding companies by names: ${error.message}`);
		}
	}
}
