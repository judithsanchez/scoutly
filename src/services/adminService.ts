import {User} from '@/models/User';
import {AdminUserService} from '@/services/adminUserService';
import {CompanyScrapeHistory} from '@/models/CompanyScrapeHistory';
import {Log} from '@/models/Log';
import {connectDB} from '@/config/database';
import {companies, CompanySeed} from '@/data/companies';
import {CompanyService} from '@/services/companyService';
import {z} from 'zod';

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

	static async getLogs({
		page = 1,
		pageSize = 20,
		userEmail,
	}: {
		page?: number;
		pageSize?: number;
		userEmail: string;
	}) {
		await connectDB();
		// Enforce admin check
		const isAdmin = await AdminUserService.isAdmin(userEmail);
		if (!isAdmin) {
			throw new Error('Unauthorized: Admin access required');
		}

		// Zod validation for input
		const ParamsSchema = z.object({
			page: z.number().min(1).default(1),
			pageSize: z.number().min(1).max(100).default(20),
		});
		const {page: safePage, pageSize: safePageSize} = ParamsSchema.parse({
			page,
			pageSize,
		});

		const skip = (safePage - 1) * safePageSize;
		const total = await Log.countDocuments();
		const logs = await Log.find()
			.sort({startTime: -1})
			.skip(skip)
			.limit(safePageSize)
			.lean();

		// Only return safe fields
		const records = logs.map(log => ({
			_id: log._id,
			processId: log.processId,
			context: log.context,
			startTime: log.startTime,
			endTime: log.endTime,
			entries: Array.isArray(log.entries)
				? log.entries.map(e => ({
						timestamp: e.timestamp,
						level: e.level,
						message: e.message,
						context: e.context,
						data: e.data ?? null,
						sequence: e.sequence,
				  }))
				: [],
		}));

		// Zod validation for output
		const LogEntrySchema = z.object({
			timestamp: z.coerce.date(),
			level: z.string(),
			message: z.string(),
			context: z.string(),
			data: z.any().nullable(),
			sequence: z.number(),
		});
		const LogRecordSchema = z.object({
			_id: z.any(),
			processId: z.string(),
			context: z.string(),
			startTime: z.coerce.date(),
			endTime: z.coerce.date(),
			entries: z.array(LogEntrySchema),
		});
		const ResponseSchema = z.object({
			total: z.number(),
			page: z.number(),
			pageSize: z.number(),
			records: z.array(LogRecordSchema),
		});
		return ResponseSchema.parse({
			total,
			page: safePage,
			pageSize: safePageSize,
			records,
		});
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
