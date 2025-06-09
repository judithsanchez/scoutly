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

const logger = new Logger('JobMatchingOrchestrator');
const MODEL_NAME = 'gemini-2.0-flash-lite';
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

	private async runInitialMatching(): Promise<void> {
		const startTime = Date.now();
		const matches = await this.performInitialMatching(
			this.scrapedJobs,
			this.cvContent,
			this.candidateInfo!,
		);

		// BUG FIX 1: De-duplicate results from the initial AI screening based on URL
		const uniqueMatches = Array.from(
			new Map(matches.map(job => [job.url, job])).values(),
		);

		this.initialMatches = uniqueMatches;
		const matchTime = (Date.now() - startTime) / 1000;

		logger.info('📊 Initial AI Matching Results:', {
			totalMatches: this.initialMatches.length,
			originalMatchesBeforeDedup: matches.length,
			originalLinks: this.scrapedJobs.length,
			matchingTime: `${matchTime}s`,
		});
	}

	private async runDeepDiveAnalysis(): Promise<JobAnalysisResult[]> {
		const analysisResults = await this.performDeepDiveAnalysis(
			this.initialMatches,
			this.cvContent,
			this.candidateInfo!,
		);
		return analysisResults;
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

	async orchestrateJobMatching(
		company: ICompany,
		cvUrl: string,
		candidateInfo: Record<string, any>,
		userEmail: string,
	): Promise<JobAnalysisResult[]> {
		try {
			const startTime = Date.now();
			logger.info('🚀 Starting job matching pipeline');
			this.resetPipelineState();

			logger.info(`📝 Step 1: Scraping ${company.company} job listings...`);
			const jobsResult = await this.scrapeJobs(company.careers_url);
			if (jobsResult.error) {
				throw new Error(`Failed to scrape jobs: ${jobsResult.error}`);
			}
			const allScrapedLinks = jobsResult.links;
			const allScrapedUrls = allScrapedLinks.map(link => link.url);

			logger.info('🗄️ Step 2: Checking for new links against user history...');
			const newLinkUrls = await ScrapeHistoryService.findNewLinks(
				company.id,
				userEmail,
				allScrapedUrls,
			);
			await ScrapeHistoryService.recordScrape(
				company.id,
				userEmail,
				allScrapedUrls,
			);
			if (newLinkUrls.length === 0) {
				logger.warn(
					`No new jobs found for ${company.company}. Ending pipeline.`,
				);
				await this.cleanup();
				return [];
			}
			logger.info(
				`Found ${newLinkUrls.length} new links for ${company.company} to analyze.`,
			);
			this.scrapedJobs = allScrapedLinks.filter(link =>
				newLinkUrls.includes(link.url),
			);

			logger.info('📋 Step 3: Processing candidate profile and CV...');
			this.initializeCandidateProfile(candidateInfo);
			await this.initializeCV(cvUrl);

			logger.info('🔍 Step 4: Running initial job matching analysis...');
			await this.runInitialMatching();
			if (this.initialMatches.length === 0) {
				logger.info(
					'No potential matches found after initial screening. Ending pipeline.',
				);
				await this.cleanup();
				return [];
			}

			logger.info('🌐 Step 5: Fetching content for matched positions...');
			for (const position of this.initialMatches) {
				try {
					const content = await this.scrapeJobDetails(position.url);
					this.detailedJobContents.set(position.url, content);
				} catch (error) {
					logger.error(`Failed to scrape details for ${position.url}`, error);
				}
			}
			if (this.detailedJobContents.size === 0) {
				logger.warn(
					'Failed to fetch content for any matched positions. Ending pipeline.',
				);
				await this.cleanup();
				return [];
			}

			logger.info('🔬 Step 6: Starting deep dive analysis...');
			const analysisResults = await this.runDeepDiveAnalysis();
			if (analysisResults.length === 0) {
				logger.warn('Deep dive analysis resulted in 0 suitable jobs.');
				await this.cleanup();
				return [];
			}

			// BUG FIX: Step 7 - Save the successful results to the database
			logger.info(
				`💾 Step 7: Saving ${analysisResults.length} matched jobs to the database...`,
			);
			const user = await UserService.getUserByEmail(userEmail);
			if (user) {
				for (const job of analysisResults) {
					try {
						await SavedJob.findOneAndUpdate(
							{user: user.id, url: job.url},
							{
								...job,
								user: user.id,
								company: company.id,
								status: ApplicationStatus.WANT_TO_APPLY,
							},
							{upsert: true, new: true, setDefaultsOnInsert: true},
						);
					} catch (dbError) {
						logger.error(`Failed to save job "${job.title}" to DB`, {
							error: dbError,
						});
					}
				}
				logger.success('✓ Successfully saved jobs to the database.');
			} else {
				logger.error('Could not find user to save jobs against.');
			}

			const totalTime = (Date.now() - startTime) / 1000;
			logger.info(`🏁 Pipeline completed in ${totalTime}s`);
			await this.cleanup();
			return analysisResults;
		} catch (error) {
			logger.error('Error in job matching pipeline:', error);
			await this.cleanup();
			throw error;
		}
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
								link =>
									`\nTitle: ${link.text}\nURL: ${link.url}\nContext: ${link.context}`,
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
			this.recordUsage(result.response.usageMetadata);
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
			`Skipping redundant title screen. Proceeding with ${positions.length} AI-selected candidate(s).`,
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

	private async scrapeJobDetails(url: string): Promise<string> {
		logger.debug('Starting job detail scrape...', {url});
		const scrapeStart = Date.now();
		try {
			await new Promise(resolve =>
				setTimeout(resolve, 1000 + Math.random() * 1000),
			);
			logger.debug('Starting scrape after delay...');
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
					return result.content;
				} catch (error) {
					lastError = error;
					attempts++;
					if (attempts < maxAttempts) {
						const backoff = Math.min(1000 * Math.pow(2, attempts), maxBackoff);
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
			throw error;
		}
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

	private recordUsage(usage: {
		promptTokenCount: number;
		candidatesTokenCount: number;
		totalTokenCount: number;
	}): void {
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

		// Save all collected logs to the database
		await logger.saveBufferedLogs();

		logger.debug('Cleanup completed');
	}

	private extractRetryDelay(error: any): number | null {
		try {
			const retryInfo = error.errorDetails?.find((d: any) =>
				d['@type'].includes('RetryInfo'),
			);
			return retryInfo?.retryDelay
				? parseInt(retryInfo.retryDelay) * 1000
				: null;
		} catch {
			return null;
		}
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
			this.recordUsage(result.response.usageMetadata);
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
}
