/**
 * AI processing utilities for job matching and analysis using Gemini
 */

import {GoogleGenerativeAI, GenerationConfig} from '@google/generative-ai';
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
}

export interface AIProcessorConfig {
	model: any; // Gemini model instance
	modelLimits: IGeminiRateLimit;
	templates: PromptTemplates;
	usageStats: UsageStats;
}

/**
 * Performs initial job matching using AI to filter relevant positions
 *
 * @param links - Job links to analyze
 * @param cvContent - CV content as text
 * @param candidateInfo - Candidate information object
 * @param config - AI processor configuration
 * @returns Array of matched job positions
 */
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

/**
 * Performs deep dive analysis on a batch of job positions
 *
 * @param batch - Array of job positions with content
 * @param cvContent - CV content as text
 * @param candidateInfo - Candidate information object
 * @param config - AI processor configuration
 * @returns Array of job analysis results
 */
export async function analyzeJobBatch(
	batch: Array<{title: string; url: string; content: string}>,
	cvContent: string,
	candidateInfo: Record<string, any>,
	config: AIProcessorConfig,
): Promise<JobAnalysisResult[]> {
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

	// Note: Usage recording should be handled by the caller

	logger.info('  ↳ Received Gemini response, processing results...');

	const analysis = JSON.parse(result.response.text());
	const validResults = analysis.analysisResults
		.filter((result: JobAnalysisResult) => result.suitabilityScore > 0)
		.sort(
			(a: JobAnalysisResult, b: JobAnalysisResult) =>
				b.suitabilityScore - a.suitabilityScore,
		);

	logger.info('📊 Batch Analysis Results:', {
		batchSize: batch.length,
		acceptedPositions: validResults.length,
		rejectedPositions: batch.length - validResults.length,
	});

	return validResults;
}

/**
 * Creates an AI processor configuration object
 *
 * @param model - Gemini model instance
 * @param modelLimits - Rate limits for the model
 * @param templates - Prompt templates
 * @param usageStats - Usage statistics object
 * @returns AI processor configuration
 */
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
