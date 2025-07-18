import {type ExtractedLink} from '@/utils/scraper';
import {Logger} from '@/utils/logger';
import {GoogleGenerativeAI} from '@google/generative-ai';
import {GeminiFreeTierLimits, type IGeminiRateLimit} from '@/config/rateLimits';
import {ICompany} from '@/models/Company';
import {ScrapeHistoryService} from './scrapeHistoryService';
import {SavedJob, ApplicationStatus} from '@/models/SavedJob';
import {UserService} from './userService';
import {TokenOperation} from '@/models/TokenUsage';
import {TokenUsageService} from './tokenUsageService';
import crypto from 'crypto';
import {JOB_MATCHING} from '@/constants/common';
import {createUrlSet, filterLinksByUrlSet} from '@/utils/dataTransform';
import {
	createUsageStats,
	checkDailyReset,
	updateUsageStats,
	type UsageStats,
} from '@/utils/rateLimiting';
import {createBatches} from '@/utils/batchProcessing';
import {
	loadPromptTemplates,
	validateTemplates,
	type PromptTemplates,
} from '@/utils/templateLoader';
import {getCvContentAsText} from '@/utils/cvProcessor';
import {scrapeJobsWithFiltering, scrapeJobDetails} from '@/utils/jobScraper';
import {
	performInitialMatching,
	analyzeJobBatch,
	createAIProcessorConfig,
	type JobAnalysisResult,
	type AIProcessorConfig,
} from '@/utils/aiProcessor';
import {executeJobMatchingPipeline} from './pipeline/JobMatchingPipelineConfig';

const logger = new Logger('JobMatchingOrchestrator');
const MODEL_NAME = 'gemini-2.0-flash-lite';
const BATCH_SIZE = 5;

export class JobMatchingOrchestrator {
	private genAI!: GoogleGenerativeAI;
	private model!: any;
	private modelLimits: IGeminiRateLimit;
	private static readonly MAX_BROWSERS = 3;
	private currentUserEmail: string = '';
	private currentCompanyId: string = '';
	private currentCompanyName: string = '';
	private usageStats: UsageStats = createUsageStats();
	private templates: PromptTemplates = {
		systemRole: '',
		firstSelectionTask: '',
		jobPostDeepDive: '',
	};
	private aiConfig!: AIProcessorConfig;
	private cvContent: string = '';
	private candidateInfo: Record<string, any> | null = null;
	private detailedJobContents: Map<string, string> = new Map();

	constructor() {
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			throw new Error('GEMINI_API_KEY environment variable is required');
		}

		logger.info(
			`Initializing with GEMINI_API_KEY: ${
				apiKey ? 'Set (length: ' + apiKey.length + ')' : 'MISSING!'
			}`,
		);

		this.genAI = new GoogleGenerativeAI(apiKey);
		this.model = this.genAI.getGenerativeModel({
			model: MODEL_NAME,
		});
		this.modelLimits = GeminiFreeTierLimits.findLimitForModel(MODEL_NAME) || {
			modelName: MODEL_NAME,
			rpm: null,
			rpd: null,
			tpm: null,
		};

		logger.debug('Rate limits initialized', {
			model: MODEL_NAME,
			limits: this.modelLimits,
		});
		this.loadPromptTemplates().catch(error => {
			logger.error('Failed to load prompt templates:', error);
			throw new Error('Failed to load required prompt templates');
		});
		logger.info(
			'JobMatchingOrchestrator initialized with pipeline architecture ENABLED',
		);
	}

	private async loadPromptTemplates() {
		this.templates = await loadPromptTemplates();
		validateTemplates(this.templates);

		this.aiConfig = createAIProcessorConfig(
			this.model,
			this.modelLimits,
			this.templates,
			this.usageStats,
		);
	}

	private async initializeCV(cvUrl: string): Promise<void> {
		this.cvContent = await getCvContentAsText(cvUrl);
		logger.success(
			`✓ CV processed. Extracted ${this.cvContent.length} characters.`,
		);
	}

	private initializeCandidateProfile(candidateInfo: Record<string, any>): void {
		this.candidateInfo = candidateInfo;
		logger.debug('Candidate Profile initialized');
	}

   private async scrapeCompanyJobs(
	   company: ICompany,
	   userId: string,
   ): Promise<{
		companyId: string;
		allScrapedLinks: ExtractedLink[];
		newLinks: ExtractedLink[];
	}> {
		logger.info(`📝 Step 1: Scraping ${company.company} job listings...`);
		const jobsResult = await scrapeJobsWithFiltering(company.careers_url);
		if (jobsResult.error) {
			throw new Error(`Failed to scrape jobs: ${jobsResult.error}`);
		}

		const allScrapedLinks = jobsResult.links;
		logger.debug('Total scraped links:', {
			count: allScrapedLinks.length,
			sample: allScrapedLinks.slice(0, 2),
		});

	   const newLinkUrls = await ScrapeHistoryService.findNewLinks(
		   company.companyID,
		   userId,
		   allScrapedLinks,
	   );

	   await ScrapeHistoryService.recordScrape(
		   company.companyID,
		   userId,
		   allScrapedLinks,
	   );

		const newUrlsSet = createUrlSet(newLinkUrls);
		const newLinks = filterLinksByUrlSet(allScrapedLinks, newUrlsSet);

		logger.info(
			`Found ${newLinks.length} new links for ${company.company} to analyze.`,
		);

		return {
			companyId: company.id,
			allScrapedLinks,
			newLinks,
		};
	}

	private async scrapeJobDetailsBatch(
		urls: string[],
	): Promise<Map<string, string>> {
		return await scrapeJobDetails(urls, {
			timeout: 120000,
			waitUntil: 'networkidle',
			maxRetries: 5,
			baseDelay: 1000,
			maxBackoff: 30000,
		});
	}

	private async performDeepDiveAnalysis(
		positions: Array<{title: string; url: string}>,
		cvContent: string,
		candidateInfo: Record<string, any>,
	): Promise<JobAnalysisResult[]> {
		logger.info(
			`Processing ${positions.length} jobs in a single deep dive analysis...`,
		);

		const validPositions = positions
			.map(position => {
				const content = this.detailedJobContents.get(position.url);
				return content ? {...position, content} : null;
			})
			.filter((p): p is NonNullable<typeof p> => p !== null);

		if (validPositions.length === 0) {
			logger.warn('No positions with content to analyze');
			return [];
		}

		// Process jobs in batches with token usage tracking
		const batches = createBatches(validPositions, BATCH_SIZE);
		const allResults: JobAnalysisResult[] = [];

		// Process each batch sequentially and record token usage
		for (let i = 0; i < batches.length; i++) {
			const batch = batches[i];
			logger.info(
				`Processing batch ${i + 1}/${batches.length} with ${
					batch.length
				} jobs...`,
			);

			this.aiConfig.usageStats = this.usageStats;
			const batchResult = await analyzeJobBatch(
				batch,
				cvContent,
				candidateInfo,
				this.aiConfig,
			);

			// Collect results
			allResults.push(...batchResult.results);

			// Record token usage for this batch
			await this.recordUsage(batchResult.tokenUsage);
		}

		return allResults.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
	}

	private async recordUsage(
		usage: {
			promptTokenCount: number;
			candidatesTokenCount: number;
			totalTokenCount: number;
		},
		operation: TokenOperation = TokenOperation.INITIAL_MATCHING,
	): Promise<void> {
		try {
			this.usageStats = checkDailyReset(this.usageStats);
			this.usageStats = updateUsageStats(
				this.usageStats,
				usage.totalTokenCount,
			);

			if (this.currentUserEmail && this.currentCompanyId) {
				const modelConfig = this.modelLimits;
				const pricePerInputToken =
					(modelConfig.pricing?.input || 0) / 1_000_000;
				const pricePerOutputToken =
					(modelConfig.pricing?.output || 0) / 1_000_000;
				const inputCost = usage.promptTokenCount * pricePerInputToken;
				const outputCost = usage.candidatesTokenCount * pricePerOutputToken;

				await TokenUsageService.recordUsage({
					processId: crypto.randomUUID(),
					operation,
					estimatedTokens: usage.promptTokenCount + usage.candidatesTokenCount,
					actualTokens: usage.totalTokenCount,
					inputTokens: usage.promptTokenCount,
					outputTokens: usage.candidatesTokenCount,
					costEstimate: {
						input: inputCost,
						output: outputCost,
						total: inputCost + outputCost,
						currency: 'USD',
						isFreeUsage: true,
					},
					userEmail: this.currentUserEmail,
					companyId: this.currentCompanyId,
					companyName: this.currentCompanyName,
				});
			}

			logger.debug('Updated token usage stats', {
				current: {
					minute: this.usageStats.minuteTokens,
					day: this.usageStats.dayTokens,
					total: this.usageStats.totalTokens,
				},
				limits: {tpm: this.modelLimits.tpm, tpd: this.modelLimits.tpd},
			});

			setTimeout(() => {
				this.usageStats.minuteTokens = 0;
				this.usageStats.lastMinuteCalls = 0;
			}, 60000);
		} catch (error) {
			logger.error('Failed to record token usage:', error);
		}
	}
	async orchestrateJobMatching(
		company: ICompany,
		cvUrl: string,
		candidateInfo: Record<string, any>,
		userId: string,
	): Promise<JobAnalysisResult[]> {
		const results = await this.orchestrateBatchJobMatching(
			[company],
			cvUrl,
			candidateInfo,
			userId,
		);
		return results.get(company.id) || [];
	}

	/**
	 * Orchestrates batch job matching across multiple companies
	 *
	 * @param companies - Array of companies to process
	 * @param cvUrl - URL to the candidate's CV
	 * @param candidateInfo - Candidate information object
	 * @param userEmail - Email of the user requesting the matching
	 * @returns Map of company IDs to their job analysis results
	 *
	 * @throws {Error} When no companies provided or too many companies
	 */
	async orchestrateBatchJobMatching(
		companies: ICompany[],
		cvUrl: string,
		candidateInfo: Record<string, any>,
		userId: string,
	): Promise<Map<string, JobAnalysisResult[]>> {
		this.validateBatchJobMatchingInput(companies);

		logger.info(JOB_MATCHING.LOG_MESSAGES.BATCH_START(companies.length));
		logger.debug(JOB_MATCHING.LOG_MESSAGES.VALIDATION_SUCCESS, {
			companiesCount: companies.length,
			userId,
			cvProvided: !!cvUrl,
			candidateInfoProvided: !!candidateInfo,
		});

		logger.debug(JOB_MATCHING.LOG_MESSAGES.PROCESSING_START);

		return this.processBatchCompanies(companies, cvUrl, candidateInfo, userId);
	}

	/**
	 * Validates the input parameters for batch job matching
	 *
	 * @private
	 * @param companies - Array of companies to validate
	 * @throws {Error} When validation fails
	 */
	private validateBatchJobMatchingInput(companies: ICompany[]): void {
		if (!companies || !Array.isArray(companies)) {
			throw new Error(JOB_MATCHING.ERROR_MESSAGES.INVALID_COMPANY_DATA);
		}

		if (companies.length === 0) {
			throw new Error(JOB_MATCHING.ERROR_MESSAGES.NO_COMPANIES_PROVIDED);
		}

		if (companies.length > JOB_MATCHING.MAX_PARALLEL_COMPANIES) {
			throw new Error(
				JOB_MATCHING.ERROR_MESSAGES.TOO_MANY_COMPANIES(
					JOB_MATCHING.MAX_PARALLEL_COMPANIES,
				),
			);
		}

		companies.forEach((company, index) => {
			if (!company || !company.id || !company.company) {
				logger.error(`Invalid company data at index ${index}:`, company);
				throw new Error(
					`${JOB_MATCHING.ERROR_MESSAGES.INVALID_COMPANY_DATA} (index: ${index})`,
				);
			}
		});
	}

	private async processBatchCompanies(
		companies: ICompany[],
		cvUrl: string,
		candidateInfo: Record<string, any>,
		userId: string,
	): Promise<Map<string, JobAnalysisResult[]>> {
		// Pipeline-only architecture
		return this.processBatchCompaniesWithPipeline(
			companies,
			cvUrl,
			candidateInfo,
			userId,
		);
	}

	/**
	 * Pipeline-based batch processing (new implementation)
	 */
	private async processBatchCompaniesWithPipeline(
		companies: ICompany[],
		cvUrl: string,
		candidateInfo: Record<string, any>,
		userId: string,
	): Promise<Map<string, JobAnalysisResult[]>> {
		logger.info('🚀 Using pipeline-based architecture for job matching');

		try {
			// Execute the complete pipeline
			const results = await executeJobMatchingPipeline(
				companies,
				cvUrl,
				candidateInfo,
				userId,
			);

			logger.info(
				`✅ Pipeline execution completed successfully for ${companies.length} companies`,
			);
			return results;
		} catch (error) {
			logger.error('❌ Pipeline execution failed', error);
			throw error;
		}
	}

	/**
	 * Pipeline architecture status (always enabled)
	 * @deprecated Pipeline is now the only architecture
	 */
	public setPipelineEnabled(enabled: boolean): void {
		// Pipeline is always enabled in this version
		logger.info(
			`Pipeline architecture is always enabled (pipeline-only version)`,
		);
	}

	/**
	 * Get current architecture information
	 */
	public getArchitectureInfo(): {usePipeline: boolean; version: string} {
		return {
			usePipeline: true,
			version: 'pipeline-only',
		};
	}
}
