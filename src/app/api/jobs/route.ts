import {Logger} from '@/utils/logger';
import {JobMatchingOrchestrator} from '@/services/jobMatchingOrchestrator';

const logger = new Logger('JobsAPI');
const orchestrator = new JobMatchingOrchestrator();

export interface JobMatchRequest {
	jobBoardUrl: string;
	cvUrl: string;
	candidateInfo: Record<string, any>;
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const {jobBoardUrl, cvUrl, candidateInfo} = body as JobMatchRequest;

		if (!jobBoardUrl || !cvUrl || !candidateInfo) {
			return Response.json(
				{error: 'Job board URL, CV URL, and candidate info are required'},
				{status: 400},
			);
		}

		logger.info('Starting job matching pipeline');
		const analysisResults = await orchestrator.orchestrateJobMatching(
			jobBoardUrl,
			cvUrl,
			candidateInfo,
		);

		return Response.json({
			positions: analysisResults,
			count: analysisResults.length,
		});
	} catch (error: any) {
		logger.error('Error processing job request:', error);
		return Response.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}
