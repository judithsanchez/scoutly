export const dynamic = 'force-dynamic';
import {NextRequest, NextResponse} from 'next/server';
// import dbConnect from '@/middleware/database';
// import {User} from '@/models/User';
// import {SavedJob} from '@/models/SavedJob';
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
		const {email} = await request.json();

		if (!email) {
			return NextResponse.json({error: 'Email is required.'}, {status: 400});
		}

		// Proxy the request to the backend API
		const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
		const backendUrl = `${apiUrl.replace(/\/$/, '')}/users/query`;

		const backendRes = await fetch(backendUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({email}),
		});

		const data = await backendRes.json();

		if (!backendRes.ok) {
			return NextResponse.json(
				{error: data.error || 'Backend error'},
				{status: backendRes.status},
			);
		}

		// Optionally validate/normalize with Zod if needed
		if (data.user) {
			const parsed = UserSchema.parse(data.user);
			return NextResponse.json({user: parsed});
		}
		return NextResponse.json(data);
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
