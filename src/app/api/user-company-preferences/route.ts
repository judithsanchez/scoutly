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

const UserCompanyPreferenceSchema = z.object({
	email: z.string().email(),
	companyId: z.string(),
	isTracking: z.boolean().optional(),
	rank: z.number().optional(),
	// frequency removed from POST schema
});

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

export async function PATCH(request: NextRequest) {
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

		// Only allow frequency in PATCH, so get it from body directly
		let {email, companyId, isTracking, rank} = parseResult.data;
		const frequency =
			typeof body.frequency === 'string' ? body.frequency : undefined;

		// Normalize frequency (case-insensitive)
		let normalizedFrequency = frequency;
		if (typeof normalizedFrequency === 'string' && normalizedFrequency) {
			const match = VALID_FREQUENCIES.find(
				f => f.toLowerCase() === normalizedFrequency!.toLowerCase(),
			);
			if (!match) {
				return NextResponse.json(
					ErrorResponseSchema.parse({
						error: `Invalid frequency. Valid options: ${VALID_FREQUENCIES.join(
							', ',
						)}`,
						details: [
							{
								code: 'invalid_enum_value',
								options: VALID_FREQUENCIES,
								path: ['frequency'],
								message: `Invalid enum value. Expected one of: ${VALID_FREQUENCIES.join(
									' | ',
								)}, received '${normalizedFrequency}'`,
							},
						],
					}),
					{status: 400},
				);
			}
			normalizedFrequency = match;
		}

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

		const updateData: any = {};
		if (typeof rank === 'number') updateData.rank = rank;
		if (typeof normalizedFrequency === 'string' && normalizedFrequency)
			updateData.frequency = normalizedFrequency;

		// Find the existing preference
		const existingPref =
			await UserCompanyPreferenceService.findByUserAndCompany(
				(user as any)._id.toString(),
				company.companyID,
			);
		if (!existingPref) {
			return NextResponse.json(
				ErrorResponseSchema.parse({
					error: 'User is not tracking this company',
				}),
				{status: 404},
			);
		}

		console.log('DEBUG PATCH updateData:', updateData, 'frequency:', frequency);
		// Update the preference
		const pref = await UserCompanyPreferenceService.upsert(
			(user as any)._id.toString(),
			company.companyID,
			updateData,
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

		return NextResponse.json(serialized);
	} catch (error: any) {
		return NextResponse.json(
			ErrorResponseSchema.parse({
				error: error.message || 'Internal server error',
			}),
			{status: 500},
		);
	}
}

// DELETE /api/user-company-preferences
export async function DELETE(request: NextRequest) {
	try {
		await dbConnect();
		const body = await request.json();
		const {email, companyId} = body;

		if (!email || !companyId) {
			return NextResponse.json(
				ErrorResponseSchema.parse({
					error: 'Missing email or companyId',
				}),
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

		const company = await CompanyService.getCompanyById(companyId);
		if (!company) {
			return NextResponse.json(
				ErrorResponseSchema.parse({error: 'Company not found'}),
				{status: 404},
			);
		}

		const pref = await UserCompanyPreferenceService.findByUserAndCompany(
			(user as any)._id.toString(),
			company.companyID,
		);
		if (!pref) {
			return NextResponse.json(
				ErrorResponseSchema.parse({error: 'User is not tracking this company'}),
				{status: 404},
			);
		}

		await pref.deleteOne();

		return NextResponse.json({success: true});
	} catch (error: any) {
		return NextResponse.json(
			ErrorResponseSchema.parse({
				error: error.message || 'Internal server error',
			}),
			{status: 500},
		);
	}
}
