/**
 * Complete Job Matching Pipeline Configuration
 *
 * Sets up and configures the full job matching pipeline with all steps
 */

import {JobMatchingPipeline} from './JobMatchingPipeline';
import {JobMatchingContext} from './JobMatchingContext';
import {
	CvProcessingStep,
	CandidateProfileStep,
	CompanyScrapingStep,
	InitialMatchingStep,
	JobDetailsStep,
	DeepAnalysisStep,
	ResultsStorageStep,
} from './steps';
import {createUsageStats} from '@/utils/rateLimiting';
import {createAIProcessorConfig} from '@/utils/aiProcessor';
import {loadPromptTemplates, validateTemplates} from '@/utils/templateLoader';
import {GoogleGenerativeAI} from '@google/generative-ai';
import {GeminiFreeTierLimits} from '@/config/rateLimits';
import {EnhancedLogger} from '@/utils/enhancedLogger';
import type {ICompany} from '@/models/Company';
import type {JobAnalysisResult} from '@/utils/aiProcessor';

const logger = EnhancedLogger.getLogger('JobMatchingPipelineConfig', {
	logToFile: true,
	logToConsole: true,
	logDir: '/tmp/scoutly-logs',
	logFileName: 'job-matching-pipeline.log',
});
const MODEL_NAME = 'gemini-2.0-flash-lite';

/**
 * Creates and configures a complete job matching pipeline
 */
export async function createJobMatchingPipeline(): Promise<JobMatchingPipeline> {
	const pipeline = new JobMatchingPipeline({
		continueOnError: false, // Fail fast for production reliability
		allowSkipping: true, // Allow skipping steps when possible
		timeoutMs: 600000, // 10 minutes timeout for entire pipeline
	});

	// Add all pipeline steps in order
	pipeline
		.addStep(new CandidateProfileStep()) // Process candidate information
		.addStep(new CvProcessingStep()) // Download and extract CV
		.addStep(new CompanyScrapingStep()) // Scrape company job listings
		.addStep(new InitialMatchingStep()) // AI-powered initial filtering
		.addStep(new JobDetailsStep()) // Fetch detailed job content
		.addStep(new DeepAnalysisStep()) // Detailed AI analysis
		.addStep(new ResultsStorageStep()); // Save to database

	logger.info('Job matching pipeline configured with 7 steps');
	return pipeline;
}

/**
 * Creates a pipeline context with all required configuration
 */
export async function createJobMatchingContext(
	companies: ICompany[],
	cvUrl: string,
	candidateInfo: Record<string, any>,
	userEmail: string,
	userId: string,
): Promise<JobMatchingContext> {
	// Initialize AI model
	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) {
		throw new Error('GEMINI_API_KEY environment variable is required');
	}

	const genAI = new GoogleGenerativeAI(apiKey);
	const model = genAI.getGenerativeModel({model: MODEL_NAME});

	// Get model limits
	const modelLimits = GeminiFreeTierLimits.findLimitForModel(MODEL_NAME);
	if (!modelLimits) {
		throw new Error(`Model limits not found for: ${MODEL_NAME}`);
	}

	// Load and validate templates
	const templates = await loadPromptTemplates();
	validateTemplates(templates);

	// Create usage stats and AI config
	const usageStats = createUsageStats();
	const aiConfig = createAIProcessorConfig(
		model,
		modelLimits,
		templates,
		usageStats,
	);

	// Create context
	const context = new JobMatchingContext(
		companies,
		cvUrl,
		candidateInfo,
		userEmail,
		userId,
		usageStats,
		aiConfig,
		modelLimits,
	);

	logger.debug('Pipeline context created successfully');
	return context;
}

/**
 * Execute the complete job matching pipeline
 */
export async function executeJobMatchingPipeline(
	companies: ICompany[],
	cvUrl: string,
	candidateInfo: Record<string, any>,
	userId: string,
): Promise<Map<string, JobAnalysisResult[]>> {
	logger.info(
		`🚀 Starting complete job matching pipeline for ${companies.length} companies`,
	);

	try {
		// Create pipeline and context
		const pipeline = await createJobMatchingPipeline();
		// userId is now passed instead of userEmail
		const context = await createJobMatchingContext(
			companies,
			cvUrl,
			candidateInfo,
			'', // userEmail is deprecated, pass empty string
			userId,
		);

		// Execute pipeline
		const result = await pipeline.execute(context);

		// Log execution summary
		logger.info('✅ Pipeline execution completed:', {
			totalSteps: result.summary.totalSteps,
			executed: result.summary.executedSteps,
			skipped: result.summary.skippedSteps,
			failed: result.summary.failedSteps,
			executionTime: `${(result.summary.executionTimeMs / 1000).toFixed(2)}s`,
		});

		// Cleanup and return results from saved jobs (actual saved jobs, not just analyzed)
		await result.context.cleanup();
		return result.context.savedJobsMap || new Map();
	} catch (error) {
		logger.error('Pipeline execution failed:', error);
		throw error;
	}
}

/**
 * Pipeline factory for different configurations
 */
export class JobMatchingPipelineFactory {
	/**
	 * Create a pipeline for testing (continues on error)
	 */
	static createTestPipeline(): JobMatchingPipeline {
		return new JobMatchingPipeline({
			continueOnError: true,
			allowSkipping: true,
			timeoutMs: 120000, // 2 minutes for testing
		})
			.addStep(new CandidateProfileStep())
			.addStep(new CvProcessingStep())
			.addStep(new CompanyScrapingStep())
			.addStep(new InitialMatchingStep())
			.addStep(new JobDetailsStep())
			.addStep(new DeepAnalysisStep())
			.addStep(new ResultsStorageStep());
	}

	/**
	 * Create a pipeline without database operations (for development)
	 */
	static createDevelopmentPipeline(): JobMatchingPipeline {
		return new JobMatchingPipeline({
			continueOnError: true,
			allowSkipping: true,
			timeoutMs: 300000,
		})
			.addStep(new CandidateProfileStep())
			.addStep(new CvProcessingStep())
			.addStep(new CompanyScrapingStep())
			.addStep(new InitialMatchingStep())
			.addStep(new JobDetailsStep())
			.addStep(new DeepAnalysisStep());
		// Note: ResultsStorageStep is omitted for development
	}

	/**
	 * Create a minimal pipeline (just scraping and basic matching)
	 */
	static createMinimalPipeline(): JobMatchingPipeline {
		return new JobMatchingPipeline({
			continueOnError: false,
			allowSkipping: true,
			timeoutMs: 180000,
		})
			.addStep(new CandidateProfileStep())
			.addStep(new CompanyScrapingStep())
			.addStep(new InitialMatchingStep());
	}
}
