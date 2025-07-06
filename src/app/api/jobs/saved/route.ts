import {NextRequest, NextResponse} from 'next/server';
import dbConnect from '@/middleware/database';
import {SavedJob} from '@/models/SavedJob';
import {User} from '@/models/User';
import {z} from 'zod';
import mongoose from 'mongoose';

// --- Zod Schemas ---
const SavedJobSchema = z.object({
	_id: z.string(),
	userId: z.string(),
	jobId: z.string(),
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

const SavedJobArraySchema = z.array(SavedJobSchema);

const GetByEmailSchema = z.object({
	email: z.string().email(),
});

const PatchStatusSchema = z.object({
	status: z.string().min(1),
});

const CreateSavedJobSchema = z.object({
	userId: z.string(),
	jobId: z.string(),
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
	salary: z.record(z.any()).optional(),
});

// --- GET: Get saved jobs by email (query param or session) or all saved jobs ---
export async function GET(request: NextRequest) {
	try {
		await dbConnect();
		const {searchParams} = new URL(request.url);
		const email = searchParams.get('email');

		let jobsRaw;
		if (email) {
			// Find user by email to get userId
			const userArr = await User.find({email}).lean();
			const user = Array.isArray(userArr) ? userArr[0] : userArr;
			if (!user) {
				return NextResponse.json(
					{error: 'User not found for provided email.'},
					{status: 404},
				);
			}
			// Ensure user._id is a string for the query
			const userIdStr =
				typeof user._id === 'object' &&
				user._id instanceof mongoose.Types.ObjectId
					? user._id.toString()
					: String(user._id);
			jobsRaw = await SavedJob.find({userId: userIdStr}).lean();
		} else {
			jobsRaw = await SavedJob.find({}).lean();
		}

		// Defensive: always array
		const jobs = Array.isArray(jobsRaw) ? jobsRaw : jobsRaw ? [jobsRaw] : [];

		// Normalize fields for Zod
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

		const normalizedJobs = jobs.map((job: any) => ({
			...job,
			_id: normalizeId(job._id),
			userId: normalizeId(job.userId),
			companyId: normalizeId(job.companyId),
			createdAt: normalizeDate(job.createdAt),
			updatedAt: normalizeDate(job.updatedAt),
		}));

		// Validate with Zod
		const parsed = SavedJobArraySchema.parse(normalizedJobs);

		return NextResponse.json({jobs: parsed});
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

// --- PATCH: Update status of a saved job ---
export async function PATCH(request: NextRequest) {
	try {
		await dbConnect();
		const {searchParams} = new URL(request.url);
		const id = searchParams.get('id');

		if (!id) {
			return NextResponse.json(
				{error: 'SavedJob id is required as query param.'},
				{status: 400},
			);
		}

		const body = await request.json();
		const parsedBody = PatchStatusSchema.parse(body);

		// Update the saved job status
		const updatedRaw = await SavedJob.findByIdAndUpdate(
			id,
			{status: parsedBody.status, updatedAt: new Date()},
			{new: true},
		).lean();

		if (!updatedRaw || Array.isArray(updatedRaw)) {
			return NextResponse.json({error: 'SavedJob not found.'}, {status: 404});
		}

		// Normalize for Zod
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

		const normalized = {
			...updatedRaw,
			_id: normalizeId(updatedRaw._id),
			userId: normalizeId(updatedRaw.userId),
			companyId: normalizeId(updatedRaw.companyId),
			createdAt: normalizeDate(updatedRaw.createdAt),
			updatedAt: normalizeDate(updatedRaw.updatedAt),
		};

		const parsed = SavedJobSchema.parse(normalized);

		return NextResponse.json({job: parsed});
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

// --- POST: Create a new saved job ---
export async function POST(request: NextRequest) {
	try {
		await dbConnect();
		const body = await request.json();
		const parsedBody = CreateSavedJobSchema.parse(body);

		// Create the saved job
		const createdRaw = await SavedJob.create({
			...parsedBody,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Defensive: .lean() not available on create, so convert to plain object
		const created = createdRaw.toObject ? createdRaw.toObject() : createdRaw;

		// Normalize for Zod
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

		const normalized = {
			...created,
			_id: normalizeId(created._id),
			userId: normalizeId(created.userId),
			companyId: normalizeId(created.companyId),
			createdAt: normalizeDate(created.createdAt),
			updatedAt: normalizeDate(created.updatedAt),
		};

		const parsed = SavedJobSchema.parse(normalized);

		return NextResponse.json({job: parsed});
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

/**
 * --- Postman Manual Test Instructions ---
 *
 * GET http://localhost:3000/api/jobs/saved
 *   - Method: GET
 *   - No query params: returns ALL saved jobs
 *   - Response: { jobs: [ ... ] }
 *
 * GET http://localhost:3000/api/jobs/saved?email=YOUR_EMAIL
 *   - Method: GET
 *   - Query param: email (optional)
 *   - Example: http://localhost:3000/api/jobs/saved?email=judithv.sanchezc@gmail.com
 *   - Response: { jobs: [ ... ] }
 *
 * PATCH http://localhost:3000/api/jobs/saved?id=JOB_ID
 *   - Method: PATCH
 *   - Query param: id (required)
 *   - Body: { "status": "NEW_STATUS" }
 *   - Example: PATCH http://localhost:3000/api/jobs/saved?id=686ad9f62f274570a4b0aa63
 *   - Body: { "status": "APPLIED" }
 *   - Response: { job: { ... } }
 *   - If id is missing or not found, returns 400/404.
 *
 * POST http://localhost:3000/api/jobs/saved
 *   - Method: POST
 *   - Body: {
 *       "userId": "USER_ID",
 *       "jobId": "JOB_ID",
 *       "companyId": "COMPANY_ID", // optional
 *       "status": "WANT_TO_APPLY",
 *       "title": "Job Title",
 *       "url": "https://job.url",
 *       ...other fields as needed...
 *     }
 *   - Response: { job: { ... } }
 *   - All required fields must be present and valid.
 */
