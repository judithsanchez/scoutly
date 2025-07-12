import AdminUser, {IAdminUser} from '@/models/AdminUser';
import {connectDB} from '@/config/database';

export class AdminUserService {
	static async promote(
		email: string,
		createdBy: string,
		role: 'admin' | 'super_admin' | 'moderator' = 'admin',
	) {
		await connectDB();
		const admin = await AdminUser.findOneAndUpdate(
			{email},
			{$set: {role, createdBy, isActive: true}},
			{upsert: true, new: true},
		);
		return admin;
	}

	static async isAdmin(email: string) {
		await connectDB();
		const admin = await AdminUser.findOne({email, isActive: true});
		return !!admin;
	}

	static async getAdmin(email: string) {
		await connectDB();
		return AdminUser.findOne({email});
	}
}
