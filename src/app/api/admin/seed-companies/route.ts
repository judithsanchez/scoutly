import {NextResponse} from 'next/server';
import connectToDB from '@/lib/db';
import {CompanyService} from '@/services/companyService';
import {companies, CompanySeed} from '@/data/companies';

export async function POST(req: Request) {
	const secret = req.headers.get('X-Internal-API-Secret');
	if (secret !== process.env.INTERNAL_API_SECRET) {
		return NextResponse.json({error: 'Unauthorized'}, {status: 401});
	}

	await connectToDB();

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

	return NextResponse.json({
		message: `Seeded ${added} new companies. Skipped ${skipped} existing companies.`,
	});
}
