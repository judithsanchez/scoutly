export const dynamic = 'force-dynamic';

import {NextRequest, NextResponse} from 'next/server';

// POST /api/jobs
export async function POST(request: NextRequest) {
	try {
		const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
		const backendUrl = `${apiUrl.replace(/\/$/, '')}/jobs`;

		const backendRes = await fetch(backendUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(await request.json()),
		});

		const data = await backendRes.json();

		if (!backendRes.ok) {
			return NextResponse.json(
				{error: data.error || 'Backend error'},
				{status: backendRes.status},
			);
		}

		return NextResponse.json(data);
	} catch (error: any) {
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}

/**
 * @openapi
 * /api/jobs:
 *   post:
 *     summary: Run AI-powered job matching for a candidate across selected companies.
 *     description: |
 *       Given a user's credentials, a list of company IDs, a CV URL, and candidate info, this endpoint orchestrates an AI-powered job matching workflow for each company.
 *       Returns a list of results per company, each containing an array of matched jobs and analysis details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               credentials:
 *                 type: object
 *                 properties:
 *                   gmail:
 *                     type: string
 *                     description: User's email address.
 *                 required:
 *                   - gmail
 *               companyIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of company IDs to match against.
 *               cvUrl:
 *                 type: string
 *                 description: Publicly accessible URL to the candidate's CV.
 *               candidateInfo:
 *                 type: object
 *                 description: Candidate profile information.
 *             required:
 *               - credentials
 *               - companyIds
 *               - cvUrl
 *               - candidateInfo
 *     responses:
 *       200:
 *         description: Job matching results per company.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JobMatchingResponse'
 *       400:
 *         description: Validation error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: array
 *                   items:
 *                     type: string
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
