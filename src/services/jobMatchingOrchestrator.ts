import {
	scrapeWebsite,
	type ExtractedLink,
	type ScrapeResult,
} from '@/utils/scraper';
import {Logger} from '@/utils/logger';
import {GoogleGenerativeAI, GenerationConfig} from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import {spawn} from 'child_process';
import os from 'os';
import {initialMatchingSchema, deepDiveSchema} from '@/utils/geminiSchemas';
import {GeminiFreeTierLimits, type IGeminiRateLimit} from '@/config/rateLimits';
import {ICompany} from '@/models/Company';
import {ScrapeHistoryService} from './scrapeHistoryService';
import {SavedJob, ApplicationStatus} from '@/models/SavedJob';
import {UserService} from './userService';
import {TokenOperation} from '@/models/TokenUsage';
import {TokenUsageService} from './tokenUsageService';
import crypto from 'crypto';

const logger = new Logger('JobMatchingOrchestrator');
const MODEL_NAME = 'gemini-2.0-flash-lite'; // Must match modelName in rateLimits.ts
const BATCH_SIZE = 5;

interface JobAnalysisResult {
	title: string;
	url: string;
	goodFitReasons: string[];
	considerationPoints: string[];
	stretchGoals: string[];
	suitabilityScore: number;
}

export class JobMatchingOrchestrator {
	private genAI!: GoogleGenerativeAI;
	private model!: any;
	private modelLimits: IGeminiRateLimit;
	private static readonly MAX_PARALLEL_COMPANIES = 10;
	private static readonly MAX_BROWSERS = 3;
	private currentUserEmail: string = '';
	private currentCompanyId: string = '';
	private currentCompanyName: string = '';
	private usageStats = {
		minuteTokens: 0,
		dayTokens: 0,
		totalTokens: 0,
		calls: 0,
		lastMinuteCalls: 0,
		lastDayCalls: 0,
		lastReset: new Date(),
	};
	private systemRole = '';
	private firstSelectionTask = '';
	private jobPostDeepDive = '';
	private scrapedJobs: ExtractedLink[] = [];
	private cvContent: string = '';
	private candidateInfo: Record<string, any> | null = null;
	private candidateXML: string = '';
	private initialMatches: Array<{title: string; url: string}> = [];
	private detailedJobContents: Map<string, string> = new Map();

	constructor() {
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			throw new Error('GEMINI_API_KEY environment variable is required');
		}
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
		logger.info('JobMatchingOrchestrator initialized');
	}

	private async loadPromptTemplates() {
		this.systemRole = await fs.readFile(
			path.join(process.cwd(), 'src/config/systemRole.md'),
			'utf-8',
		);
		this.firstSelectionTask = await fs.readFile(
			path.join(process.cwd(), 'src/config/firstSelectionTask.md'),
			'utf-8',
		);
		this.jobPostDeepDive = await fs.readFile(
			path.join(process.cwd(), 'src/config/jobPostDeepDive.md'),
			'utf-8',
		);
	}

	private resetPipelineState(): void {
		this.scrapedJobs = [];
		this.cvContent = '';
		this.candidateInfo = null;
		this.candidateXML = '';
		this.initialMatches = [];
		this.detailedJobContents.clear();
	}

	private async initializeCV(cvUrl: string): Promise<void> {
		this.cvContent = await this.getCvContentAsText(cvUrl);
		logger.success(
			`✓ CV processed. Extracted ${this.cvContent.length} characters.`,
		);
	}

	private initializeCandidateProfile(candidateInfo: Record<string, any>): void {
		this.candidateInfo = candidateInfo;
		this.candidateXML = this.objectToXML(candidateInfo);
		logger.debug('Candidate Profile initialized as XML');
	}

	// Helper method to convert objects to XML format
	private objectToXML(obj: any): string {
		if (obj === null || obj === undefined) return '';
		if (Array.isArray(obj)) {
			return obj
				.map(
					item =>
						`<item>${
							typeof item === 'object' ? this.objectToXML(item) : item
						}</item>`,
				)
				.join('');
		}
		if (typeof obj === 'object') {
			let xml = '';
			for (const [key, value] of Object.entries(obj)) {
				const tag = key.replace(/[^a-zA-Z0-9]/g, '');
				xml += `<${tag}>${
					typeof value === 'object' ? this.objectToXML(value) : value
				}</${tag}>`;
			}
			return xml;
		}
		return String(obj);
	}

	// Helper method to scrape jobs for a single company
	private async scrapeCompanyJobs(
		company: ICompany,
		userEmail: string,
	): Promise<{
		companyId: string;
		allScrapedLinks: ExtractedLink[];
		newLinks: ExtractedLink[];
	}> {
		logger.info(`📝 Step 1: Scraping ${company.company} job listings...`);
		const jobsResult = await this.scrapeJobs(company.careers_url);
		if (jobsResult.error) {
			throw new Error(`Failed to scrape jobs: ${jobsResult.error}`);
		}

		const allScrapedLinks = jobsResult.links;
		logger.debug('Total scraped links:', {
			count: allScrapedLinks.length,
			sample: allScrapedLinks.slice(0, 2),
		});

		const newLinkUrls = await ScrapeHistoryService.findNewLinks(
			company.id,
			userEmail,
			allScrapedLinks,
		);

		// Record all links for future comparisons
		await ScrapeHistoryService.recordScrape(
			company.id,
			userEmail,
			allScrapedLinks,
		);

		// Create a Set for O(1) lookups
		const newUrlsSet = new Set(newLinkUrls.map(url => String(url)));
		const newLinks = allScrapedLinks.filter(link =>
			newUrlsSet.has(String(link.url)),
		);

		logger.info(
			`Found ${newLinks.length} new links for ${company.company} to analyze.`,
		);

		return {
			companyId: company.id,
			allScrapedLinks,
			newLinks,
		};
	}

	// Batch scraping of job details
	private async scrapeJobDetailsBatch(
		urls: string[],
	): Promise<Map<string, string>> {
		const contents = new Map<string, string>();
		const batches: string[][] = [];

		// Split URLs into batches according to MAX_BROWSERS
		for (
			let i = 0;
			i < urls.length;
			i += JobMatchingOrchestrator.MAX_BROWSERS
		) {
			batches.push(urls.slice(i, i + JobMatchingOrchestrator.MAX_BROWSERS));
		}

		logger.info(
			`Scraping ${urls.length} jobs in ${batches.length} batches of up to ${JobMatchingOrchestrator.MAX_BROWSERS}...`,
		);

		// Process each batch
		for (const [batchIndex, batchUrls] of batches.entries()) {
			logger.info(
				`Processing batch ${batchIndex + 1}/${batches.length} (${
					batchUrls.length
				} jobs)`,
			);

			try {
				// Scrape urls in current batch in parallel
				const batchResults = await Promise.all(
					batchUrls.map(async url => {
						const scrapeStart = Date.now();
						try {
							// Add delay between requests in batch
							await new Promise(resolve =>
								setTimeout(resolve, 1000 + Math.random() * 1000),
							);

							let attempts = 0;
							const maxAttempts = 5;
							const maxBackoff = 30000;
							let lastError: any;

							while (attempts < maxAttempts) {
								try {
									const result = await scrapeWebsite({
										url,
										options: {
											timeout: 120000,
											waitUntil: 'networkidle',
										},
									});
									if (result.error) {
										throw new Error(result.error);
									}
									return {url, content: result.content};
								} catch (error) {
									lastError = error;
									attempts++;
									if (attempts < maxAttempts) {
										const backoff = Math.min(
											1000 * Math.pow(2, attempts),
											maxBackoff,
										);
										logger.warn(
											`Scrape attempt ${attempts} failed, retrying in ${backoff}ms...`,
											{url, error},
										);
										await new Promise(resolve => setTimeout(resolve, backoff));
									} else {
										throw lastError;
									}
								}
							}
							throw new Error('All retry attempts failed');
						} catch (error) {
							const scrapeTime = (Date.now() - scrapeStart) / 1000;
							logger.error('Unexpected error during job detail scrape:', {
								url,
								error,
								timeSpent: `${scrapeTime}s`,
							});
							return {url, content: ''};
						}
					}),
				);

				// Add successful results to map
				batchResults.forEach(({url, content}) => {
					if (content) {
						contents.set(url, content);
					}
				});

				// Add delay between batches if not the last batch
				if (batchIndex < batches.length - 1) {
					await new Promise(resolve =>
						setTimeout(resolve, 2000 + Math.random() * 2000),
					);
				}
			} catch (error) {
				logger.error(`Failed to process batch ${batchIndex + 1}:`, error);
			}
		}

		return contents;
	}

	private async performInitialMatching(
		links: ExtractedLink[],
		cvContent: string,
		candidateInfo: Record<string, any>,
	): Promise<Array<{title: string; url: string}>> {
		const candidateXML = this.objectToXML(candidateInfo);
		const prompt = `
${this.systemRole}
${this.firstSelectionTask}
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
		await this.checkRateLimits();
		const result = await this.model.generateContent({
			contents: [{role: 'user', parts: [{text: prompt}]}],
			generationConfig,
		});
		if (result.response.usageMetadata) {
			this.recordUsage(
				result.response.usageMetadata,
				TokenOperation.INITIAL_MATCHING,
			);
		}
		const responseText = result.response.text();
		return JSON.parse(responseText).recommendedPositions || [];
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

		const results: JobAnalysisResult[] = [];
		const batches: Array<typeof validPositions> = [];

		// Split into batches to avoid token limits
		for (let i = 0; i < validPositions.length; i += BATCH_SIZE) {
			batches.push(validPositions.slice(i, i + BATCH_SIZE));
		}

		logger.info(
			`Processing ${validPositions.length} jobs in ${batches.length} batches...`,
		);

		for (let i = 0; i < batches.length; i++) {
			const batch = batches[i];
			logger.info(
				`Processing batch ${i + 1}/${batches.length} (${batch.length} jobs)...`,
			);

			try {
				const batchResults = await this.analyzeJobBatch(
					batch,
					cvContent,
					candidateInfo,
				);
				results.push(...batchResults);
			} catch (error: any) {
				logger.error(`Failed to process batch ${i + 1}:`, {error});
			}
		}

		return results.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
	}

	private async analyzeJobBatch(
		batch: Array<{title: string; url: string; content: string}>,
		cvContent: string,
		candidateInfo: Record<string, any>,
	): Promise<JobAnalysisResult[]> {
		const candidateXML = this.objectToXML(candidateInfo);
		logger.debug('Analyzing batch:', {
			batchSize: batch.length,
			jobs: batch.map(job => job.title),
		});

		const prompt = `
${this.systemRole}
${this.jobPostDeepDive}
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
		await this.checkRateLimits();
		const result = await this.model.generateContent({
			contents: [{role: 'user', parts: [{text: prompt}]}],
			generationConfig,
		});

		if (result.response.usageMetadata) {
			this.recordUsage(
				result.response.usageMetadata,
				TokenOperation.DEEP_DIVE_ANALYSIS,
			);
		}

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

	private async checkRateLimits(): Promise<void> {
		const {tpm, rpm, rpd} = this.modelLimits;
		const now = new Date();
		if (now.getTime() - this.usageStats.lastReset.getTime() > 86400000) {
			this.usageStats.dayTokens = 0;
			this.usageStats.lastDayCalls = 0;
			this.usageStats.lastReset = now;
		}
		if (rpd && this.usageStats.lastDayCalls >= rpd) {
			const msUntilTomorrow =
				86400000 - (now.getTime() - this.usageStats.lastReset.getTime());
			logger.warn(
				`Daily request limit (${rpd}) reached, waiting ${Math.ceil(
					msUntilTomorrow / 1000,
				)}s for reset`,
			);
			await new Promise(resolve => setTimeout(resolve, msUntilTomorrow));
			this.usageStats.lastDayCalls = 0;
		}
		if (rpm && this.usageStats.lastMinuteCalls >= rpm) {
			logger.warn(
				`Minute request limit (${rpm}) reached, waiting for next minute`,
			);
			await new Promise(resolve => setTimeout(resolve, 60000));
			this.usageStats.lastMinuteCalls = 0;
		}
		if (tpm && this.usageStats.minuteTokens >= tpm) {
			logger.warn(
				`Minute token limit (${tpm}) reached, waiting for next minute`,
			);
			await new Promise(resolve => setTimeout(resolve, 60000));
			this.usageStats.minuteTokens = 0;
		}
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
			const now = new Date();
			if (now.getTime() - this.usageStats.lastReset.getTime() > 86400000) {
				this.usageStats.dayTokens = 0;
				this.usageStats.lastDayCalls = 0;
				this.usageStats.lastReset = now;
			}
			this.usageStats.minuteTokens += usage.totalTokenCount;
			this.usageStats.dayTokens += usage.totalTokenCount;
			this.usageStats.totalTokens += usage.totalTokenCount;
			this.usageStats.calls++;
			this.usageStats.lastMinuteCalls++;
			this.usageStats.lastDayCalls++;

			if (this.currentUserEmail && this.currentCompanyId) {
				const modelConfig = this.modelLimits;
				const pricePerInputToken =
					(modelConfig.pricing?.input || 0) / 1_000_000;
				const pricePerOutputToken =
					(modelConfig.pricing?.output || 0) / 1_000_000;

				const inputCost = usage.promptTokenCount * pricePerInputToken;
				const outputCost = usage.candidatesTokenCount * pricePerOutputToken;
				const totalCost = inputCost + outputCost;

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
						total: totalCost,
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
				limits: {
					tpm: this.modelLimits.tpm,
					tpd: this.modelLimits.tpd,
				},
			});

			setTimeout(() => {
				this.usageStats.minuteTokens = 0;
				this.usageStats.lastMinuteCalls = 0;
			}, 60000);
		} catch (error) {
			logger.error('Failed to record token usage:', error);
		}
	}

	private getUsageSummary(): string {
		return [
			`Model: ${this.modelLimits.modelName}`,
			`Last minute: ${this.usageStats.minuteTokens} tokens${
				this.modelLimits.tpm ? ` (limit: ${this.modelLimits.tpm})` : ''
			}`,
			`Today: ${this.usageStats.dayTokens} tokens${
				this.modelLimits.tpd ? ` (limit: ${this.modelLimits.tpd})` : ''
			}`,
			`All time: ${this.usageStats.totalTokens} tokens across ${this.usageStats.calls} calls`,
			`Average per call: ${
				Math.round(this.usageStats.totalTokens / this.usageStats.calls) || 0
			} tokens`,
		].join('\n');
	}

	private async cleanup() {
		logger.debug('Starting cleanup...');
		const usageSummary = this.getUsageSummary();
		logger.info('🔢 Final AI usage statistics:', {
			usage: usageSummary.split('\n'),
		});
		this.detailedJobContents.clear();
		this.initialMatches = [];
		this.scrapedJobs = [];
		this.cvContent = '';
		this.candidateXML = '';
		this.candidateInfo = null;
		this.currentUserEmail = '';
		this.currentCompanyId = '';
		this.currentCompanyName = '';

		await logger.saveBufferedLogs();
		logger.debug('Cleanup completed');
	}

	private async scrapeJobs(url: string): Promise<ScrapeResult> {
		const result = await scrapeWebsite({url});
		if (result.links.length > 0) {
			const filteredLinks = result.links.filter(link => {
				const title = link.text.toLowerCase();
				if (
					title.length < 5 ||
					title.includes('login') ||
					title.includes('sign') ||
					title.includes('cookie') ||
					title.includes('privacy')
				) {
					logger.debug(`Filtered out non-job link: ${link.text}`);
					return false;
				}
				return true;
			});
			logger.info(
				`Early filtering reduced links from ${result.links.length} to ${filteredLinks.length}`,
			);
			result.links = filteredLinks;
		}
		return result;
	}

	// Backward compatible method for single company processing
	async orchestrateJobMatching(
		company: ICompany,
		cvUrl: string,
		candidateInfo: Record<string, any>,
		userEmail: string,
	): Promise<JobAnalysisResult[]> {
		const results = await this.orchestrateBatchJobMatching(
			[company],
			cvUrl,
			candidateInfo,
			userEmail,
		);
		return results.get(company.id) || [];
	}

	// Method to orchestrate batch job matching
	async orchestrateBatchJobMatching(
		companies: ICompany[],
		cvUrl: string,
		candidateInfo: Record<string, any>,
		userEmail: string,
	): Promise<Map<string, JobAnalysisResult[]>> {
		if (!companies.length) {
			throw new Error('No companies provided for batch processing');
		}

		if (companies.length > JobMatchingOrchestrator.MAX_PARALLEL_COMPANIES) {
			throw new Error(
				`Maximum of ${JobMatchingOrchestrator.MAX_PARALLEL_COMPANIES} companies can be processed in parallel`,
			);
		}

		logger.info(
			`🚀 Starting batch job matching for ${companies.length} companies`,
		);
		return this.processBatchCompanies(
			companies,
			cvUrl,
			candidateInfo,
			userEmail,
		);
	}

	// Process multiple companies in parallel
	private async processBatchCompanies(
		companies: ICompany[],
		cvUrl: string,
		candidateInfo: Record<string, any>,
		userEmail: string,
	): Promise<Map<string, JobAnalysisResult[]>> {
		const results = new Map<string, JobAnalysisResult[]>();
		const startTime = Date.now();

		// Step 1: Scrape all companies in parallel
		const scrapingResults = await Promise.all(
			companies.map(company =>
				this.scrapeCompanyJobs(company, userEmail).catch(error => {
					logger.error(`Failed to scrape company ${company.company}:`, error);
					return {
						companyId: company.id,
						allScrapedLinks: [],
						newLinks: [],
					};
				}),
			),
		);

		// Step 2: Initialize candidate data
		logger.info('📋 Step 2: Processing candidate profile and CV...');
		this.initializeCandidateProfile(candidateInfo);
		await this.initializeCV(cvUrl);

		// Step 3: Combine all new links for a single AI analysis
		const companyLinks = new Map<string, ExtractedLink[]>();
		const allNewLinks: ExtractedLink[] = [];

		scrapingResults.forEach(({companyId, newLinks}) => {
			if (newLinks.length > 0) {
				companyLinks.set(companyId, newLinks);
				allNewLinks.push(...newLinks);
			}
		});

		if (allNewLinks.length === 0) {
			logger.warn('No new jobs found across all companies. Ending pipeline.');
			return results;
		}

		// Step 4: Perform initial matching on all links at once
		logger.info(
			`🔍 Step 4: Running initial job matching analysis for ${allNewLinks.length} jobs...`,
		);
		const matchedJobs = await this.performInitialMatching(
			allNewLinks,
			this.cvContent,
			this.candidateInfo!,
		);

		// Step 5: Group matched jobs by company
		const matchedJobsByCompany = new Map<
			string,
			Array<{title: string; url: string}>
		>();

		matchedJobs.forEach(job => {
			// Find which company this job belongs to
			for (const [companyId, links] of companyLinks.entries()) {
				if (links.some(link => link.url === job.url)) {
					const companyMatches = matchedJobsByCompany.get(companyId) || [];
					companyMatches.push(job);
					matchedJobsByCompany.set(companyId, companyMatches);
					break;
				}
			}
		});

		// Step 6: Process each company's matched jobs
		for (const [companyId, companyMatches] of matchedJobsByCompany.entries()) {
			if (companyMatches.length === 0) continue;

			try {
				// Set company context for token usage tracking
				const company = companies.find(c => c.id === companyId);
				if (!company) continue;

				this.currentCompanyId = companyId;
				this.currentCompanyName = company.company;

				// Get all job details in parallel
				logger.info(
					`🌐 Step 5: Fetching content for ${companyMatches.length} matched positions from ${company.company}...`,
				);

				const urls = companyMatches.map(match => match.url);
				this.detailedJobContents = await this.scrapeJobDetailsBatch(urls);

				if (this.detailedJobContents.size === 0) {
					logger.warn(
						`Failed to fetch content for any matched positions from ${company.company}.`,
					);
					results.set(companyId, []);
					continue;
				}

				logger.info(
					`🔬 Step 6: Starting deep dive analysis for ${company.company}...`,
				);
				const analysisResults = await this.performDeepDiveAnalysis(
					companyMatches,
					this.cvContent,
					this.candidateInfo!,
				);

				if (analysisResults.length === 0) {
					logger.warn(
						`Deep dive analysis resulted in 0 suitable jobs for ${company.company}.`,
					);
					results.set(companyId, []);
					continue;
				}

				// Save jobs to database
				const user = await UserService.getUserByEmail(userEmail);
				if (user) {
					let savedCount = 0;
					let skippedCount = 0;

					for (const job of analysisResults) {
						try {
							const existingJob = await SavedJob.findOne({
								user: user.id,
								url: job.url,
							});

							if (existingJob) {
								logger.debug(
									`Skipping duplicate job: "${job.title}" (${job.url})`,
								);
								skippedCount++;
								continue;
							}

							await SavedJob.create({
								...job,
								user: user.id,
								company: companyId,
								status: ApplicationStatus.WANT_TO_APPLY,
							});
							savedCount++;
						} catch (dbError) {
							logger.error(`Failed to process job "${job.title}"`, {
								error: dbError,
								url: job.url,
							});
						}
					}

					logger.success(
						`✓ Database update complete for ${company.company}: ${savedCount} new jobs saved, ${skippedCount} duplicates skipped.`,
					);
				}

				results.set(companyId, analysisResults);
			} catch (error) {
				logger.error(
					`Failed to process matched jobs for company ${companyId}:`,
					error,
				);
				results.set(companyId, []);
			}
		}

		const totalTime = (Date.now() - startTime) / 1000;
		logger.info(
			`🏁 Batch processing completed in ${totalTime}s for ${companies.length} companies`,
		);
		return results;
	}

	private async getCvContentAsText(cvUrl: string): Promise<string> {
		logger.info('Processing CV from URL using Python helper...', {url: cvUrl});
		const tempFilePath = path.join(os.tmpdir(), `cv-${Date.now()}.pdf`);
		try {
			const url = new URL(cvUrl);
			let fileId: string | null = null;
			if (url.hostname === 'drive.google.com') {
				const match = url.pathname.match(/\/d\/([^/]+)/);
				fileId = match ? match[1] : null;
			}
			if (!fileId) {
				throw new Error('Could not extract file ID from Google Drive URL.');
			}
			const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
			const response = await fetch(downloadUrl);
			if (!response.ok) {
				throw new Error(`Failed to download file: ${response.statusText}`);
			}
			const pdfBuffer = await response.arrayBuffer();
			await fs.writeFile(tempFilePath, Buffer.from(pdfBuffer));
			logger.debug(`PDF saved temporarily to: ${tempFilePath}`);
			return new Promise((resolve, reject) => {
				const pythonProcess = spawn('python3', [
					'src/scripts/pdf_extractor.py',
					tempFilePath,
				]);
				let extractedText = '';
				let errorOutput = '';
				pythonProcess.stdout.on('data', data => {
					extractedText += data.toString();
				});
				pythonProcess.stderr.on('data', data => {
					errorOutput += data.toString();
				});
				pythonProcess.on('close', code => {
					fs.unlink(tempFilePath).catch(e =>
						logger.warn(`Failed to delete temp file: ${tempFilePath}`, e),
					);
					if (code !== 0) {
						logger.error('Python script exited with error code:', {
							code,
							errorOutput,
						});
						reject(new Error(`Python script failed: ${errorOutput}`));
					} else {
						logger.success(
							'Successfully extracted text from CV via Python script.',
						);
						resolve(extractedText);
					}
				});
				pythonProcess.on('error', err => {
					logger.error('Failed to spawn Python script.', err);
					fs.unlink(tempFilePath).catch(e =>
						logger.warn(`Failed to delete temp file: ${tempFilePath}`, e),
					);
					reject(err);
				});
			});
		} catch (error) {
			logger.error('Failed to process CV from Google Drive link.', error);
			await fs.unlink(tempFilePath).catch(() => {});
			throw new Error('Could not read CV content from the provided URL.');
		}
	}
}
