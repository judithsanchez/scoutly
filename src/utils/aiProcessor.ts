import {GenerationConfig} from '@google/generative-ai';
import {Logger} from './logger';
import {initialMatchingSchema, deepDiveSchema} from './geminiSchemas';
import {objectToXML} from './dataTransform';
import {checkRateLimits, type UsageStats} from './rateLimiting';
import {type IGeminiRateLimit} from '@/config/rateLimits';
import {TokenOperation} from '@/models/TokenUsage';
import {type PromptTemplates} from './templateLoader';
import {type ExtractedLink} from './scraper';

const logger = new Logger('AIProcessor');

export interface JobAnalysisResult {
	title: string;
	url: string;
	goodFitReasons: string[];
	considerationPoints: string[];
	stretchGoals: string[];
	suitabilityScore: number;

	location?: string;
	timezone?: string;
	salary?: {
		min?: number;
		max?: number;
		currency?: string;
		period?: string;
	};
	techStack?: string[];
	experienceLevel?: string;
	languageRequirements?: string[];
	visaSponsorshipOffered?: boolean;
	relocationAssistanceOffered?: boolean;
}

export interface AnalysisResultWithUsage {
	results: JobAnalysisResult[];
	tokenUsage: {
		promptTokenCount: number;
		candidatesTokenCount: number;
		totalTokenCount: number;
	};
}

export interface AIProcessorConfig {
	model: any;
	modelLimits: IGeminiRateLimit;
	templates: PromptTemplates;
	usageStats: UsageStats;
}

export async function performInitialMatching(
	links: ExtractedLink[],
	cvContent: string,
	candidateInfo: Record<string, any>,
	config: AIProcessorConfig,
): Promise<Array<{title: string; url: string}>> {
	const candidateXML = objectToXML(candidateInfo);
	const prompt = `
${config.templates.systemRole}
${config.templates.firstSelectionTask}
Analyze these job postings based on the candidate's profile and the following CV content.
<CandidateProfile>${candidateXML}</CandidateProfile>
<CVContent>${cvContent}</CVContent>
Links to analyze:
${links
	.map(
		link => `\nTitle: ${link.text}\nURL: ${link.url}\nContext: ${link.context}`,
	)
	.join('')}`;

	logger.info('Waiting for AI initial screening with structured output...');

	const generationConfig: GenerationConfig = {
		responseMimeType: 'application/json',
		responseSchema: initialMatchingSchema,
	};

	await checkRateLimits(config.modelLimits, config.usageStats);

	const result = await config.model.generateContent({
		contents: [{role: 'user', parts: [{text: prompt}]}],
		generationConfig,
	});

	// Note: Usage recording should be handled by the caller since it requires access to service methods

	const responseText = result.response.text();
	return JSON.parse(responseText).recommendedPositions || [];
}

export async function analyzeJobBatch(
	batch: Array<{title: string; url: string; content: string}>,
	cvContent: string,
	candidateInfo: Record<string, any>,
	config: AIProcessorConfig,
): Promise<AnalysisResultWithUsage> {
	const candidateXML = objectToXML(candidateInfo);

	logger.debug('Analyzing batch:', {
		batchSize: batch.length,
		jobs: batch.map(job => job.title),
	});

	const prompt = `
${config.templates.systemRole}
${config.templates.jobPostDeepDive}
<CandidateProfile>${candidateXML}</CandidateProfile>
<CVContent>${cvContent}</CVContent>
<JobsToAnalyze>
${batch
	.map(
		job =>
			`<Job><Title>${job.title}</Title><URL>${job.url}</URL><Content>${job.content}</Content></Job>`,
	)
	.join('\n')}
</JobsToAnalyze>`;

	logger.info('  ↳ Starting analysis of batch...');

	const generationConfig: GenerationConfig = {
		responseMimeType: 'application/json',
		responseSchema: deepDiveSchema,
	};

	await checkRateLimits(config.modelLimits, config.usageStats);

	const result = await config.model.generateContent({
		contents: [{role: 'user', parts: [{text: prompt}]}],
		generationConfig,
	});

	const tokenUsage = {
		promptTokenCount: result.response.usageMetadata?.promptTokenCount || 0,
		candidatesTokenCount:
			result.response.usageMetadata?.candidatesTokenCount || 0,
		totalTokenCount: result.response.usageMetadata?.totalTokenCount || 0,
	};

	logger.debug('Gemini response token usage:', tokenUsage);

	logger.info('  ↳ Received Gemini response, processing results...');

	const analysis = JSON.parse(result.response.text());

	const allResults = analysis.analysisResults || [];
	const rejectedResults = allResults.filter(
		(result: any) => result.suitabilityScore === 0,
	);
	const lowScoreResults = allResults.filter(
		(result: any) =>
			result.suitabilityScore > 0 && result.suitabilityScore < 30,
	);

	if (rejectedResults.length > 0) {
		logger.warn('🚫 AI rejected the following jobs with detailed analysis:', {
			rejectedCount: rejectedResults.length,
			rejections: rejectedResults.map((job: any) => ({
				title: job.title,
				url: job.url,
				location: job.location || 'Not specified',
				suitabilityScore: job.suitabilityScore,
				languageRequirements: job.languageRequirements || [],
				visaSponsorshipOffered: job.visaSponsorshipOffered || false,
				relocationAssistanceOffered: job.relocationAssistanceOffered || false,
				experienceLevel: job.experienceLevel || 'Not specified',
				techStack: job.techStack?.slice(0, 5) || [], // First 5 technologies
				considerationPoints: job.considerationPoints,
				goodFitReasons: job.goodFitReasons || [],
				stretchGoals: job.stretchGoals || [],
			})),
		});

		const dealBreakerAnalysis = rejectedResults.map((job: any) => {
			const rejectionReasons = [];

			if (
				job.location &&
				job.location.toLowerCase().includes('us') &&
				!job.visaSponsorshipOffered
			) {
				rejectionReasons.push('US location without visa sponsorship');
			}
			if (
				job.location &&
				job.location.toLowerCase().includes('uk') &&
				!job.visaSponsorshipOffered
			) {
				rejectionReasons.push('UK location without visa sponsorship');
			}

			if (job.languageRequirements && job.languageRequirements.length > 0) {
				const candidateLanguages = ['spanish', 'english', 'dutch'];
				const missingLanguages = job.languageRequirements.filter(
					(lang: string) =>
						!candidateLanguages.some(
							candidateLang =>
								candidateLang.toLowerCase().includes(lang.toLowerCase()) ||
								lang.toLowerCase().includes(candidateLang.toLowerCase()),
						),
				);
				if (missingLanguages.length > 0) {
					rejectionReasons.push(
						`Missing language requirements: ${missingLanguages.join(', ')}`,
					);
				}
			}

			if (
				job.experienceLevel &&
				job.experienceLevel.toLowerCase().includes('senior') &&
				job.considerationPoints.some(
					(point: string) =>
						point.toLowerCase().includes('junior') ||
						point.toLowerCase().includes('entry'),
				)
			) {
				rejectionReasons.push('Experience level mismatch (domain transfer)');
			}

			return {
				title: job.title,
				url: job.url,
				detectedDealBreakers: rejectionReasons,
				aiConsiderationPoints: job.considerationPoints,
			};
		});

		logger.warn(
			'🔍 Deal-breaker analysis for rejected jobs:',
			dealBreakerAnalysis,
		);
	}

	if (lowScoreResults.length > 0) {
		logger.info('⚠️ Low scoring jobs (0-30 points) - marginal fits:', {
			lowScoreCount: lowScoreResults.length,
			lowScoreJobs: lowScoreResults.map((job: any) => ({
				title: job.title,
				suitabilityScore: job.suitabilityScore,
				mainConcerns: job.considerationPoints?.slice(0, 3) || [],
				positives: job.goodFitReasons?.slice(0, 2) || [],
			})),
		});
	}

	const validResults = allResults
		.filter((result: JobAnalysisResult) => result.suitabilityScore > 0)
		.sort(
			(a: JobAnalysisResult, b: JobAnalysisResult) =>
				b.suitabilityScore - a.suitabilityScore,
		);

	logger.info('📊 Batch Analysis Results:', {
		batchSize: batch.length,
		acceptedPositions: validResults.length,
		rejectedPositions: batch.length - validResults.length,
		totalAnalyzed: allResults.length,
	});

	return {
		results: validResults,
		tokenUsage,
	};
}

export function createAIProcessorConfig(
	model: any,
	modelLimits: IGeminiRateLimit,
	templates: PromptTemplates,
	usageStats: UsageStats,
): AIProcessorConfig {
	return {
		model,
		modelLimits,
		templates,
		usageStats,
	};
}
