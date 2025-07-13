import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, header, secret} from '@/config/environment';
import {endpoint} from '@/constants';
import {logger} from '@/utils/logger';
import {z} from 'zod';

let AdminService: any;
try {
	AdminService = require('@/services/adminService').AdminService;
} catch {}

const seedCompaniesSchema = z.object({}).passthrough();

export async function POST(req: NextRequest) {
	if (!deployment.isVercel) {
		await logger.debug(`POST ${endpoint.admin.seed_companies} called`, {
			env: {...env},
			deployment: {...deployment},
		});

		const apiSecret = req.headers.get(header.INTERNAL_API_SECRET.toLowerCase();
		if (!apiSecret || apiSecret !== secret.internalApiSecret) {
			await logger.error('Unauthorized seed companies attempt');
			return NextResponse.json({error: 'Unauthorized'}, {status: 401});
		}

		if (!AdminService) {
			await logger.error('AdminService not implemented');
			return NextResponse.json(
				{error: 'AdminService not implemented'},
				{status: 501},
			);
		}

		let body: any = {};
		try {
			const text = await req.text();
			body = text ? JSON.parse(text) : {};
		} catch (e) {
			await logger.warn('Invalid JSON body for seed companies', {error: e});
			return NextResponse.json({error: 'Invalid JSON body'}, {status: 400});
		}

		const parseResult = seedCompaniesSchema.safeParse(body);
		if (!parseResult.success) {
			await logger.warn('Invalid seed companies payload', {
				issues: parseResult.error.issues,
			});
			return NextResponse.json(
				{
					error: 'Invalid seed companies payload',
					details: parseResult.error.issues,
				},
				{status: 400},
			);
		}

		try {
			const result = await AdminService.seedCompanies(parseResult.data);
			await logger.success('Companies seeded', {result});
			return NextResponse.json(result);
		} catch (error) {
			await logger.error('Error seeding companies', error);
			return NextResponse.json(
				{
					error: 'Error seeding companies',
					details: (error as Error).message,
				},
				{status: 500},
			);
		}
	}
}
