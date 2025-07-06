import {Logger} from '@/utils/logger';
import {CompanyService} from '@/services/companyService';
import {JobMatchingOrchestrator} from '@/services/jobMatchingOrchestrator';
import dbConnect from '@/middleware/database';
import {NextRequest, NextResponse} from 'next/server';
import {UserService} from '@/services/userService';
import {JobMatchingResponseSchema} from '@/schemas/jobMatchingSchemas';

const logger = new Logger('JobsAPI');

export interface JobAnalysisRequest {
	credentials: {
		gmail: string;
	};
	companyIds: string[];
	cvUrl: string;
	candidateInfo: Record<string, any>;
}

// Helper to fill missing fields with defaults for Zod validation
function normalizeJobMatchResult(result: any) {
	return {
		considerationPoints: result.considerationPoints ?? [],
		goodFitReasons: result.goodFitReasons ?? [],
		stretchGoals: result.stretchGoals ?? [],
		suitabilityScore: result.suitabilityScore ?? 0,
		title: result.title ?? '',
		url: result.url ?? '',
		experienceLevel: result.experienceLevel ?? '',
		languageRequirements: result.languageRequirements ?? [],
		location: result.location ?? '',
		relocationAssistanceOffered: result.relocationAssistanceOffered ?? false,
		salary: result.salary ?? {},
		techStack: result.techStack ?? [],
		timezone: result.timezone ?? '',
		visaSponsorshipOffered: result.visaSponsorshipOffered ?? false,
	};
}

function normalizeCompanyResult(companyResult: any) {
	return {
		company: companyResult.company ?? '',
		processed: companyResult.processed ?? false,
		results: Array.isArray(companyResult.results)
			? companyResult.results.map(normalizeJobMatchResult)
			: [],
		error: companyResult.error,
		companyId: companyResult.companyId,
	};
}

export async function POST(request: NextRequest) {
	try {
		await dbConnect();

		const body = (await request.json()) as JobAnalysisRequest;
		const {credentials, companyIds, cvUrl, candidateInfo} = body;

		// Enhanced validation with detailed error messages
		const validationErrors = [];

		if (!credentials?.gmail) {
			validationErrors.push('gmail credentials are required');
		}
		if (!cvUrl) {
			validationErrors.push('cvUrl is required');
		}
		if (!candidateInfo) {
			validationErrors.push('candidateInfo is required');
		}
		if (!companyIds || !Array.isArray(companyIds) || companyIds.length === 0) {
			validationErrors.push(
				'companyIds array with at least one company is required',
			);
		}

		if (validationErrors.length > 0) {
			logger.warn('Job search request validation failed:', {
				errors: validationErrors,
				requestBody: {
					hasCredentials: !!credentials,
					hasGmail: !!credentials?.gmail,
					hasCvUrl: !!cvUrl,
					hasCandidateInfo: !!candidateInfo,
					companyIdsCount: companyIds?.length || 0,
					userEmail: credentials?.gmail || 'unknown',
				},
			});

			return NextResponse.json(
				{
					error: 'Validation failed',
					details: validationErrors,
					message: validationErrors.join(', '),
				},
				{status: 400},
			);
		}

		logger.info('Starting job search for user:', {
			userEmail: credentials.gmail,
			companiesCount: companyIds.length,
			companies: companyIds,
		});

		// Ensure the user exists (this is quick)
		await UserService.getOrCreateUser(credentials.gmail);

		// Instantiate the orchestrator once for reuse
		const orchestrator = new JobMatchingOrchestrator();

		// Process each company sequentially
		const results = [];
		for (const companyId of companyIds) {
			let companyName = companyId; // Default to companyId
			try {
				// Get the company details from the database by companyID
				const company = await CompanyService.getCompanyById(companyId);
				if (!company) {
					logger.warn(`Company '${companyId}' not found in the database.`);
					results.push({
						company: companyId,
						processed: false,
						error: 'Company not found in the database',
						results: [],
					});
					continue;
				}

				companyName = company.company; // Update with actual company name

				logger.info(`Processing company: ${companyName} (${companyId})`);

				// Run the main AI workflow
				const analysisResults = await orchestrator.orchestrateJobMatching(
					company,
					cvUrl,
					candidateInfo,
					credentials.gmail,
				);

				logger.success(
					`Job matching pipeline completed for ${company.company}. Found ${analysisResults.length} suitable jobs.`,
				);

				results.push({
					company: company.company,
					processed: true,
					results: analysisResults,
				});
			} catch (error: any) {
				logger.error(
					`Error processing company ${companyName} (${companyId}):`,
					{
						error: error.message,
						stack: error.stack,
						companyId,
						companyName,
						userEmail: credentials.gmail,
					},
				);

				results.push({
					company: companyName,
					processed: false,
					error:
						error.message || 'An error occurred while processing this company',
					results: [],
					companyId, // Include companyId for debugging
				});
			}
		}

		// Normalize results for Zod validation
		const normalizedResults = results.map(normalizeCompanyResult);

		// Validate and document the response with Zod
		const response = JobMatchingResponseSchema.parse({
			results: normalizedResults,
		});

		return NextResponse.json(response);
	} catch (error: any) {
		logger.error('Error in /api/jobs route:', {
			message: error.message,
			stack: error.stack,
		});
		return NextResponse.json(
			{
				error: error.errors
					? JSON.stringify(error.errors, null, 2)
					: error.message || 'An internal server error occurred.',
			},
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
