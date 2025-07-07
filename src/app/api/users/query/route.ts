export const dynamic = 'force-dynamic';
import {NextRequest, NextResponse} from 'next/server';
import dbConnect from '@/middleware/database';
import {User} from '@/models/User';
import {SavedJob} from '@/models/SavedJob';
import {z} from 'zod';

// --- Zod Schemas ---

const SavedJobSchema = z.object({
	_id: z.string(), // Always string after normalization
	userId: z.string().optional(),
	jobId: z.string().optional(),
	companyId: z.string().optional(),
	status: z.string(),
	title: z.string(),
	url: z.string(),
	goodFitReasons: z.array(z.string()).optional(),
	considerationPoints: z.array(z.string()).optional(),
	stretchGoals: z.array(z.string()).optional(),
	suitabilityScore: z.number().optional(),
	location: z.string().optional(),
	techStack: z.array(z.string()).optional(),
	experienceLevel: z.string().optional(),
	languageRequirements: z.array(z.string()).optional(),
	visaSponsorshipOffered: z.boolean().optional(),
	relocationAssistanceOffered: z.boolean().optional(),
	notes: z.string().optional(),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional(),
	__v: z.number().optional(),
	salary: z.record(z.any()).optional(),
});

const UserSchema = z.object({
	_id: z.string(),
	email: z.string(),
	cvUrl: z.string().optional(),
	candidateInfo: z.record(z.any()).optional(),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional(),
	__v: z.number().optional(),
	savedJobs: z.array(SavedJobSchema).optional(),
});

export async function POST(request: NextRequest) {
	try {
		await dbConnect();
		const {email} = await request.json();

		if (!email) {
			return NextResponse.json({error: 'Email is required.'}, {status: 400});
		}

		// Find user and populate saved jobs
		const userDocRaw = await User.findOne({email}).lean();
		if (!userDocRaw) {
			return NextResponse.json({error: 'User not found.'}, {status: 404});
		}

		// Defensive: If userDocRaw is an array (shouldn't be), use the first element
		const userDoc = Array.isArray(userDocRaw) ? userDocRaw[0] : userDocRaw;

		// Populate saved jobs
		let savedJobsRaw = await SavedJob.find({userId: userDoc._id}).lean();

		// If savedJobs is not an array, make it an array
		const savedJobs = Array.isArray(savedJobsRaw)
			? savedJobsRaw
			: savedJobsRaw
			? [savedJobsRaw]
			: [];

		// Convert all _id, createdAt, updatedAt, companyId to strings for Zod validation
		const normalizeId = (id: any) =>
			typeof id === 'object' && id !== null && id.toString
				? id.toString()
				: id ?? '';

		const normalizeDate = (date: any) =>
			date instanceof Date
				? date.toISOString()
				: typeof date === 'string'
				? date
				: '';

		const normalizedSavedJobs = savedJobs.map((job: any) => ({
			...job,
			_id: normalizeId(job._id),
			companyId: normalizeId(job.companyId),
			createdAt: normalizeDate(job.createdAt),
			updatedAt: normalizeDate(job.updatedAt),
		}));

		const normalizedUser = {
			...userDoc,
			_id: normalizeId(userDoc._id),
			createdAt: normalizeDate(userDoc.createdAt),
			updatedAt: normalizeDate(userDoc.updatedAt),
			savedJobs: normalizedSavedJobs,
		};

		// Validate with Zod
		const parsed = UserSchema.parse(normalizedUser);

		return NextResponse.json({user: parsed});
	} catch (error: any) {
		return NextResponse.json(
			{
				error: error.errors
					? JSON.stringify(error.errors, null, 2)
					: error.message || 'Internal server error',
			},
			{status: 500},
		);
	}
}
