import {Logger} from '@/utils/logger';
import {CompanyService} from '@/services/companyService';
import {JobMatchingOrchestrator} from '@/services/jobMatchingOrchestrator';
import dbConnect from '@/middleware/database';
import {NextRequest, NextResponse} from 'next/server';
import {UserService} from '@/services/userService';

const logger = new Logger('JobsAPI');

export interface JobAnalysisRequest {
	credentials: {
		gmail: string;
	};
	companyIds: string[];
	cvUrl: string;
	candidateInfo: Record<string, any>;
}

export async function POST(request: NextRequest) {
	try {
		await dbConnect();

		const body = (await request.json()) as JobAnalysisRequest;
		const {credentials, companyIds, cvUrl, candidateInfo} = body;

		if (
			!credentials?.gmail ||
			!cvUrl ||
			!candidateInfo ||
			!companyIds ||
			companyIds.length === 0
		) {
			return NextResponse.json(
				{error: 'gmail, cvUrl, candidateInfo, and companyIds are required.'},
				{status: 400},
			);
		}

		// Ensure the user exists (this is quick)
		await UserService.getOrCreateUser(credentials.gmail);

		// Instantiate the orchestrator once for reuse
		const orchestrator = new JobMatchingOrchestrator();

		// Process each company sequentially
		const results = [];
		for (const companyId of companyIds) {
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
				logger.error(`Error processing company ${companyName}:`, error);
				results.push({
					company: companyName,
					processed: false,
					error:
						error.message || 'An error occurred while processing this company',
					results: [],
				});
			}
		}

		return NextResponse.json({results});
	} catch (error: any) {
		logger.error('Error in /api/jobs route:', {
			message: error.message,
			stack: error.stack,
		});
		return NextResponse.json(
			{error: error.message || 'An internal server error occurred.'},
			{status: 500},
		);
	}
}
