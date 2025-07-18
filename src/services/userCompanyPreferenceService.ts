import {UserCompanyPreference} from '@/models/UserCompanyPreference';
import {Company} from '@/models/Company';

export const UserCompanyPreferenceService = {
	async getByUserId(userId: string) {
		const preferences = await UserCompanyPreference.find({userId});
		// Flat shape for Zod validation
		const flat = preferences.map(
			(
				pref: import('@/models/UserCompanyPreference').IUserCompanyPreference,
			) => ({
				_id: pref._id.toString(),
				userId: pref.userId,
				companyId: pref.companyId.toString(),
				rank: pref.rank,
				isTracking: pref.isTracking,
				frequency: pref.frequency,
				createdAt:
					pref.createdAt instanceof Date
						? pref.createdAt.toISOString()
						: pref.createdAt,
				updatedAt:
					pref.updatedAt instanceof Date
						? pref.updatedAt.toISOString()
						: pref.updatedAt,
			}),
		);
		// Joined shape for frontend
		const joined = [];
		for (const pref of preferences) {
			const company = await Company.findById(pref.companyId);
			if (!company) continue;
			joined.push({
				_id: company._id.toString(),
				id: company._id.toString(),
				company: company.company,
				careers_url: company.careers_url,
				logo_url: company.logo_url,
				userPreference: {
					rank: pref.rank,
					isTracking: pref.isTracking,
					frequency: pref.frequency,
					lastUpdated:
						pref.updatedAt instanceof Date
							? pref.updatedAt.toISOString()
							: pref.updatedAt,
				},
			});
		}
		return {companies: flat, joined};
	},

	async getByEmail(email: string) {
		const preferences = await UserCompanyPreference.find({email});
		const flat = preferences.map(
			(
				pref: import('@/models/UserCompanyPreference').IUserCompanyPreference,
			) => ({
				_id: pref._id.toString(),
				userId: pref.userId,
				companyId: pref.companyId.toString(),
				rank: pref.rank,
				isTracking: pref.isTracking,
				frequency: pref.frequency,
				createdAt:
					pref.createdAt instanceof Date
						? pref.createdAt.toISOString()
						: pref.createdAt,
				updatedAt:
					pref.updatedAt instanceof Date
						? pref.updatedAt.toISOString()
						: pref.updatedAt,
			}),
		);
		const joined = [];
		for (const pref of preferences) {
			const company = await Company.findById(pref.companyId);
			if (!company) continue;
			joined.push({
				_id: company._id.toString(),
				id: company._id.toString(),
				company: company.company,
				careers_url: company.careers_url,
				logo_url: company.logo_url,
				userPreference: {
					rank: pref.rank,
					isTracking: pref.isTracking,
					frequency: pref.frequency,
					lastUpdated:
						pref.updatedAt instanceof Date
							? pref.updatedAt.toISOString()
							: pref.updatedAt,
				},
			});
		}
		return {companies: flat, joined};
	},

	async create(data: any) {
		if (Array.isArray(data)) {
			const created = await UserCompanyPreference.insertMany(data);
			return {success: true, created};
		} else {
			const created = await UserCompanyPreference.create(data);
			return {success: true, created};
		}
	},

	async update(data: any) {
		if (Array.isArray(data)) {
			const results = [];
			for (const item of data) {
				const updated = await UserCompanyPreference.findByIdAndUpdate(
					item._id,
					item,
					{new: true},
				);
				results.push(updated);
			}
			return {success: true, updated: results};
		} else {
			const updated = await UserCompanyPreference.findByIdAndUpdate(
				data._id,
				data,
				{new: true},
			);
			return {success: true, updated};
		}
	},

	async delete(data: any) {
		if (Array.isArray(data)) {
			const results = [];
			for (const item of data) {
				const deleted = await UserCompanyPreference.findByIdAndDelete(item._id);
				results.push(deleted);
			}
			return {success: true, deleted: results};
		} else {
			const deleted = await UserCompanyPreference.findByIdAndDelete(data._id);
			return {success: true, deleted};
		}
	},

	async deleteByCompanyId(companyId: string, data: any) {
		const filter: any = {companyId};
		if (data?.userId) filter.userId = data.userId;
		if (data?.email) filter.email = data.email;
		const deleted = await UserCompanyPreference.findOneAndDelete(filter);
		return {success: true, deleted};
	},

	async updateByCompanyId(companyId: string, data: any) {
		const filter: any = {companyId};
		if (data?.userId) filter.userId = data.userId;
		if (data?.email) filter.email = data.email;
	   const updatedDoc = await UserCompanyPreference.findOneAndUpdate(filter, data, {
		   new: true,
	   });
	   let updated = null;
	   if (updatedDoc) {
		   updated = {
			   _id: updatedDoc._id.toString(),
			   userId: updatedDoc.userId,
			   companyId: updatedDoc.companyId.toString(),
			   rank: updatedDoc.rank,
			   isTracking: updatedDoc.isTracking,
			   frequency: updatedDoc.frequency,
			   createdAt: updatedDoc.createdAt instanceof Date ? updatedDoc.createdAt.toISOString() : String(updatedDoc.createdAt),
			   updatedAt: updatedDoc.updatedAt instanceof Date ? updatedDoc.updatedAt.toISOString() : String(updatedDoc.updatedAt),
		   };
	   }
	   return {success: true, updated};
	},
};

async function joinWithCompany(preferences: any[]) {
	const trackedCompanies = [];
	for (const pref of preferences ?? []) {
		const company = await Company.findById(pref.companyId);
		if (!company) continue;
		trackedCompanies.push({
			_id: company._id,
			companyID: company.companyID,
			company: company.company,
			careers_url: company.careers_url,
			logo_url: company.logo_url,
			userPreference: {
				rank: pref.rank,
				isTracking: pref.isTracking,
				frequency: pref.frequency,
				lastUpdated: pref.updatedAt,
			},
		});
	}
	return trackedCompanies;
}
