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
	companyNames: string[];
	cvUrl: string;
	candidateInfo: Record<string, any>;
}

export async function POST(request: NextRequest) {
	try {
		await dbConnect();

		const body = (await request.json()) as JobAnalysisRequest;
		const {credentials, companyNames, cvUrl, candidateInfo} = body;

		if (
			!credentials?.gmail ||
			!cvUrl ||
			!candidateInfo ||
			!companyNames ||
			companyNames.length === 0
		) {
			return NextResponse.json(
				{error: 'gmail, cvUrl, candidateInfo, and companyNames are required.'},
				{status: 400},
			);
		}

		// This implementation will process the first company in the list.
		const companyName = companyNames[0];

		// Ensure the user exists (this is quick)
		await UserService.getOrCreateUser(credentials.gmail);

		// Get the company details from the database
		const companies = await CompanyService.findCompaniesByName([companyName]);
		if (companies.length === 0) {
			return NextResponse.json(
				{error: `Company '${companyName}' not found in the database.`},
				{status: 404},
			);
		}
		const company = companies[0];

		// Instantiate and run the main AI workflow
		const orchestrator = new JobMatchingOrchestrator();
		const analysisResults = await orchestrator.orchestrateJobMatching(
			company, // Pass the full company object
			cvUrl,
			candidateInfo,
			credentials.gmail, // Pass the email for history tracking
		);

		logger.success(
			`Job matching pipeline completed for ${company.company}. Found ${analysisResults.length} suitable jobs.`,
		);

		return NextResponse.json({
			company: company.company,
			processed: true,
			results: analysisResults,
		});
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
