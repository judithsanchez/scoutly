import {NextRequest, NextResponse} from 'next/server';
import dbConnect from '@/middleware/database';
import {UserService} from '@/services/userService';
import {CompanyService} from '@/services/companyService';
import {UserCompanyPreferenceService} from '@/services/userCompanyPreferenceService';
import {z} from 'zod';
import {ErrorResponseSchema} from '@/schemas/userSchemas';

const VALID_FREQUENCIES = [
	'Daily',
	'Every 2 days',
	'Weekly',
	'Bi-weekly',
	'Monthly',
];

// Helper: Calculate frequency from rank (same as user info endpoint)
function calculateFrequency(rank: number | undefined): string {
	if (typeof rank !== 'number') return 'Weekly';
	if (rank >= 90) return 'Daily';
	if (rank >= 75) return 'Every 2 days';
	if (rank >= 50) return 'Weekly';
	if (rank >= 25) return 'Bi-weekly';
	return 'Monthly';
}

const UserCompanyPreferenceSchema = z.object({
	email: z.string().email(),
	companyId: z.string(),
	isTracking: z.boolean().optional(),
	rank: z.number().optional(),
	// frequency removed from POST schema
});

// --- GET handler for tracked companies ---
export async function GET(request: NextRequest) {
	try {
		await dbConnect();
		const {searchParams} = new URL(request.url);
		const email = searchParams.get('email');
		if (!email) {
			return NextResponse.json(
				ErrorResponseSchema.parse({error: 'Missing email query parameter'}),
				{status: 400},
			);
		}
		const user = await UserService.getUserByEmail(email);
		if (!user) {
			return NextResponse.json(
				ErrorResponseSchema.parse({error: 'User not found'}),
				{status: 404},
			);
		}
		// Get tracked companies with preferences
		const preferences = await UserCompanyPreferenceService.findByUserId(
			(user._id as any).toString(),
		);
		// Populate company data if not already populated
		const companies = preferences.map(preference => {
			const company = preference.companyId as any;
			const rank = preference.rank;
			return {
				_id: company._id?.toString?.() ?? company._id,
				companyID: company.companyID,
				company: company.company,
				careers_url: company.careers_url,
				logo_url: company.logo_url,
				userPreference: {
					rank: rank,
					isTracking: preference.isTracking,
					frequency: calculateFrequency(rank),
					lastUpdated: preference.updatedAt,
				},
			};
		});
		return NextResponse.json({companies});
	} catch (error: any) {
		return NextResponse.json(
			ErrorResponseSchema.parse({
				error: error.message || 'Internal server error',
			}),
			{status: 500},
		);
	}
}

// --- POST handler for tracking a company ---
export async function POST(request: NextRequest) {
	try {
		await dbConnect();
		const body = await request.json();
		const parseResult = UserCompanyPreferenceSchema.safeParse(body);

		if (!parseResult.success) {
			return NextResponse.json(
				ErrorResponseSchema.parse({
					error: 'Invalid request body',
					details: parseResult.error.errors,
				}),
				{status: 400},
			);
		}

		let {email, companyId, isTracking, rank} = parseResult.data;

		// No frequency allowed in POST, so nothing to normalize

		const user = await UserService.getUserByEmail(email);
		if (!user) {
			return NextResponse.json(
				ErrorResponseSchema.parse({error: 'User not found'}),
				{status: 404},
			);
		}

		const company = await CompanyService.getCompanyById(companyId);
		if (!company) {
			return NextResponse.json(
				ErrorResponseSchema.parse({error: 'Company not found'}),
				{status: 404},
			);
		}

		const createData: any = {};
		if (typeof isTracking === 'boolean') createData.isTracking = isTracking;
		if (typeof rank === 'number') createData.rank = rank;
		// Do not allow frequency in POST

		const existingPref =
			await UserCompanyPreferenceService.findByUserAndCompany(
				(user as any)._id.toString(),
				company.companyID,
			);
		if (existingPref) {
			return NextResponse.json(
				ErrorResponseSchema.parse({
					error: 'User is already tracking this company',
				}),
				{status: 400},
			);
		}

		const pref = await UserCompanyPreferenceService.create(
			(user as any)._id.toString(),
			company.companyID,
			createData,
		);

		// Serialize for response
		const obj = typeof pref.toObject === 'function' ? pref.toObject() : pref;
		const serialized = {
			...obj,
			_id: obj._id?.toString?.() ?? obj._id,
			userId: obj.userId?.toString?.() ?? obj.userId,
			companyId: obj.companyId?.toString?.() ?? obj.companyId,
			updatedAt: obj.updatedAt
				? new Date(obj.updatedAt as any).toISOString()
				: undefined,
			createdAt: obj.createdAt
				? new Date(obj.createdAt as any).toISOString()
				: undefined,
		};

		return NextResponse.json(serialized, {status: 201});
	} catch (error: any) {
		return NextResponse.json(
			ErrorResponseSchema.parse({
				error: error.message || 'Internal server error',
			}),
			{status: 500},
		);
	}
}

// ... (rest of the PATCH, DELETE handlers remain unchanged)
