export const dynamic = 'force-dynamic';
import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';

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
export const GET = async (request: NextRequest) => {
	try {
		const backendUrl = process.env.NEXT_PUBLIC_API_URL;
		if (!backendUrl) {
			return NextResponse.json(
				{error: 'Backend API URL not configured'},
				{status: 500},
			);
		}
		const url = new URL(request.url);
		const email = url.searchParams.get('email');
		let apiUrl = `${backendUrl}/jobs/saved`;
		if (email) {
			apiUrl += `?email=${encodeURIComponent(email)}`;
		}
		const res = await fetch(apiUrl, {
			method: 'GET',
			headers: {'Content-Type': 'application/json'},
		});
		const data = await res.json();
		return NextResponse.json(data, {status: res.status});
	} catch (error: any) {
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
};
// (no trailing brace)

// --- PATCH: Update status of a saved job ---
export const PATCH = async (request: NextRequest) => {
	// Proxy PATCH to backend API
	try {
		const backendUrl = process.env.NEXT_PUBLIC_API_URL;
		if (!backendUrl) {
			return NextResponse.json(
				{error: 'Backend API URL not configured'},
				{status: 500},
			);
		}
		const url = new URL(request.url);
		const id = url.searchParams.get('id');
		if (!id) {
			return NextResponse.json(
				{error: 'SavedJob id is required as query param.'},
				{status: 400},
			);
		}
		const body = await request.json();
		const res = await fetch(
			`${backendUrl}/jobs/saved?id=${encodeURIComponent(id)}`,
			{
				method: 'PATCH',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify(body),
			},
		);
		const data = await res.json();
		return NextResponse.json(data, {status: res.status});
	} catch (error: any) {
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
};

// --- POST: Create a new saved job ---
export const POST = async (request: NextRequest) => {
	// Proxy POST to backend API
	try {
		const backendUrl = process.env.NEXT_PUBLIC_API_URL;
		if (!backendUrl) {
			return NextResponse.json(
				{error: 'Backend API URL not configured'},
				{status: 500},
			);
		}
		const body = await request.json();
		const res = await fetch(`${backendUrl}/jobs/saved`, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify(body),
		});
		const data = await res.json();
		return NextResponse.json(data, {status: res.status});
	} catch (error: any) {
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
};

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
