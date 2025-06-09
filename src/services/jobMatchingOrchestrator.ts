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

const logger = new Logger('JobMatchingOrchestrator');
const MODEL_NAME = 'gemini-2.0-flash-lite';
const BATCH_SIZE = 5; // Process 5 jobs at a time

interface JobAnalysisResult {
	title: string;
	url: string;
	goodFitReasons: string[];
	considerationPoints: string[];
	stretchGoals: string[];
	suitabilityScore: number;
}

export class JobMatchingOrchestrator {
	// Core services
	private genAI!: GoogleGenerativeAI;
	private model!: any;

	// Rate limiting state
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

	// Templates
	private systemRole = '';
	private firstSelectionTask = '';
	private jobPostDeepDive = '';

	// Pipeline state
	private scrapedJobs: ExtractedLink[] = [];
	private cvContent: string = '';
	private candidateInfo: Record<string, any> | null = null;
	private candidateXML: string = '';
	private initialMatches: Array<{title: string; url: string}> = [];
	private detailedJobContents: Map<string, string> = new Map();

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

	private async initializeJobs(jobBoardUrl: string): Promise<void> {
		const jobsResult = await this.scrapeJobs(jobBoardUrl);
		if (jobsResult.error) {
			throw new Error(`Failed to scrape jobs: ${jobsResult.error}`);
		}

		this.scrapedJobs = jobsResult.links;

		// Get 3 random job samples
		const getRandomJobs = (jobs: ExtractedLink[], count: number) => {
			const shuffled = [...jobs].sort(() => Math.random() - 0.5);
			return shuffled.slice(0, count);
		};

		logger.info('📊 Initial Job Board Scrape Results:', {
			totalJobs: this.scrapedJobs.length,
			sampleJobs: getRandomJobs(this.scrapedJobs, 3).map(link => ({
				title: link.text,
				url: link.url,
			})),
		});
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
			this.candidateInfo!, // Using non-null assertion as we validate state before running
		);

		this.initialMatches = matches;
		const matchTime = (Date.now() - startTime) / 1000;

		logger.info('📊 Initial AI Matching Results:', {
			totalMatches: this.initialMatches.length,
			originalLinks: this.scrapedJobs.length,
			matchingTime: `${matchTime}s`,
		});
	}

	private async runDeepDiveAnalysis(): Promise<JobAnalysisResult[]> {
		// Get full content for each matched position
		const analysisResults = await this.performDeepDiveAnalysis(
			this.initialMatches,
			this.cvContent,
			this.candidateInfo!, // Using non-null assertion as we validate state before running
		);

		return analysisResults;
	}

	constructor() {
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			throw new Error('GEMINI_API_KEY environment variable is required');
		}

		this.genAI = new GoogleGenerativeAI(apiKey);
		this.model = this.genAI.getGenerativeModel({
			model: MODEL_NAME,
		});

		// Initialize rate limits
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

	private objectToXML(obj: any): string {
		if (obj === null || obj === undefined) return '';

		// Handle arrays
		if (Array.isArray(obj)) {
			return obj
				.map(item => {
					// Use 'item' as tag for array elements
					return `<item>${
						typeof item === 'object' ? this.objectToXML(item) : item
					}</item>`;
				})
				.join('');
		}

		// Handle objects
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

		// Handle primitive values
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
					// Clean up the file regardless of success or failure
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
			// Attempt cleanup in case of download/write failure
			await fs.unlink(tempFilePath).catch(() => {});
			throw new Error('Could not read CV content from the provided URL.');
		}
	}

	async orchestrateJobMatching(
		jobBoardUrl: string,
		cvUrl: string,
		candidateInfo: Record<string, any>,
	): Promise<JobAnalysisResult[]> {
		try {
			const startTime = Date.now();
			logger.info('🚀 Starting job matching pipeline');

			// Reset state for new pipeline run
			this.resetPipelineState();

			// Step 1: Scrape job board for initial listings
			logger.info('📝 Step 1: Scraping job board listings...');
			const jobsResult = await this.scrapeJobs(jobBoardUrl);
			if (jobsResult.error) {
				throw new Error(`Failed to scrape jobs: ${jobsResult.error}`);
			}

			this.scrapedJobs = jobsResult.links;
			const jobScrapeTime = (Date.now() - startTime) / 1000;
			logger.info('📊 Initial Job Board Results:', {
				totalJobs: this.scrapedJobs.length,
				timeToScrape: `${jobScrapeTime}s`,
				sampleJobs: this.getRandomJobs(this.scrapedJobs, 3).map(link => ({
					title: link.text,
					url: link.url,
				})),
			});

			if (this.scrapedJobs.length === 0) {
				logger.warn('No jobs found on the job board. Ending pipeline.');
				return [];
			}

			// Step 2: Process candidate profile (sync operation)
			logger.info('📋 Step 2: Processing candidate profile...');
			this.initializeCandidateProfile(candidateInfo);
			logger.success('✓ Candidate profile processed');

			// Step 3: Process CV
			logger.info('📄 Step 3: Processing CV...');
			const cvStartTime = Date.now();
			this.cvContent = await this.getCvContentAsText(cvUrl);
			const cvTime = (Date.now() - cvStartTime) / 1000;
			logger.success(`✓ CV processed in ${cvTime}s`);

			// Step 4: Perform initial AI matching
			logger.info('🔍 Step 4: Running initial job matching analysis...');
			const matchingStartTime = Date.now();
			await this.runInitialMatching();
			const matchingTime = (Date.now() - matchingStartTime) / 1000;
			logger.success(`✓ Initial matching completed in ${matchingTime}s`);

			if (this.initialMatches.length === 0) {
				logger.info(
					'No potential matches found after initial screening. Ending pipeline.',
				);
				return [];
			}

			// Step 5: Scrape matched positions one by one
			logger.info('🌐 Step 5: Fetching content for matched positions...');
			const detailsStartTime = Date.now();

			logger.info(
				`Starting sequential scrape of ${this.initialMatches.length} job postings...`,
			);
			const positionList = this.initialMatches.map(p => ({
				title: p.title,
				url: p.url,
			}));

			logger.debug('Jobs to process:', {positions: positionList});

			const totalJobs = this.initialMatches.length;
			const estimatedSeconds = Math.ceil(totalJobs * 7);
			const estimatedMinutes = Math.floor(estimatedSeconds / 60);
			const remainingSeconds = estimatedSeconds % 60;

			logger.info('Starting sequential job scraping:', {
				totalJobs,
				estimatedTime:
					estimatedMinutes > 0
						? `~${estimatedMinutes}m ${remainingSeconds}s`
						: `~${estimatedSeconds}s`,
				startedAt: new Date().toISOString(),
			});

			// Process one position at a time
			for (let i = 0; i < this.initialMatches.length; i++) {
				const position = this.initialMatches[i];
				const scrapeStart = Date.now();

				const remaining = this.initialMatches.length - (i + 1);
				const timeLeft = Math.ceil(remaining * 7);
				logger.info(
					`🔍 Processing job ${i + 1}/${this.initialMatches.length}:`,
					{
						title: position.title,
						url: position.url,
						progress: `${Math.round(
							((i + 1) / this.initialMatches.length) * 100,
						)}%`,
						remainingJobs: remaining,
						estimatedTimeLeft:
							timeLeft > 60
								? `~${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s`
								: `~${timeLeft}s`,
					},
				);

				try {
					// Wait between scrapes with increasing backoff
					const baseDelay = 5000 + i * 1000; // Start at 5s, add 1s per job
					const jitter = Math.random() * 2000; // Add up to 2s random jitter
					const delay = baseDelay + jitter;

					logger.info('Waiting between scrapes...', {
						delay: `${Math.round(delay / 1000)}s`,
						job: position.title,
					});
					await new Promise(resolve => setTimeout(resolve, delay));

					logger.debug(`Starting scrape for ${position.title}`);
					const content = await this.scrapeJobDetails(position.url);

					// Store result
					this.detailedJobContents.set(position.url, content);
					const scrapeTime = (Date.now() - scrapeStart) / 1000;

					logger.success(
						`✓ [${i + 1}/${this.initialMatches.length}] Successfully scraped ${
							position.title
						} (${scrapeTime}s)`,
						{
							title: position.title,
							timeSpent: scrapeTime,
							contentLength: content.length,
						},
					);
				} catch (error) {
					logger.error(
						`❌ [${i + 1}/${this.initialMatches.length}] Failed to scrape ${
							position.title
						}`,
						{
							error,
							title: position.title,
							url: position.url,
						},
					);
				}
			}

			const detailsTime = (Date.now() - detailsStartTime) / 1000;
			const avgTimePerJob = detailsTime / this.initialMatches.length;
			logger.success(
				`✓ Job details fetched (${this.detailedJobContents.size}/${this.initialMatches.length})`,
				{
					totalTime: `${detailsTime}s`,
					averagePerJob: `${avgTimePerJob.toFixed(1)}s`,
					successRate: `${(
						(this.detailedJobContents.size / this.initialMatches.length) *
						100
					).toFixed(0)}%`,
				},
			);

			if (this.detailedJobContents.size === 0) {
				logger.warn(
					'Failed to fetch content for any matched positions. Ending pipeline.',
				);
				return [];
			}

			// Step 6: Perform deep dive analysis
			logger.info('🔬 Step 6: Starting deep dive analysis...');
			const deepDiveStart = Date.now();
			const analysisResults = await this.runDeepDiveAnalysis();
			const deepDiveTime = (Date.now() - deepDiveStart) / 1000;
			logger.success(`✓ Deep dive analysis completed in ${deepDiveTime}s`);

			const totalTime = (Date.now() - startTime) / 1000;
			logger.info(`🏁 Pipeline completed in ${totalTime}s`);

			// Clean up resources at the end
			this.cleanup();

			return analysisResults;
		} catch (error) {
			logger.error('Error in job matching pipeline:', error);
			// Clean up on error
			this.cleanup();
			throw error;
		}
	}

	private getRandomJobs(jobs: ExtractedLink[], count: number) {
		const shuffled = [...jobs].sort(() => Math.random() - 0.5);
		return shuffled.slice(0, count);
	}

	// Method removed as its functionality is now in orchestrateJobMatching

	private async scrapeJobs(url: string): Promise<ScrapeResult> {
		const result = await scrapeWebsite({url});

		// Early filtering of non-job links
		if (result.links.length > 0) {
			const filteredLinks = result.links.filter(link => {
				const title = link.text.toLowerCase();
				// Skip navigation, utility and non-job links
				if (
					title.length < 5 ||
					title.includes('read more') ||
					title.includes('apply') ||
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
		// Log the processed candidate information
		const candidateXML = this.objectToXML(candidateInfo);
		logger.debug('Processed Candidate Profile XML:', {
			stage: 'Initial Matching',
			xml: candidateXML,
		});

		const prompt = `
            ${this.systemRole}
            ${this.firstSelectionTask}
            Analyze these job postings based on the candidate's profile and the following CV content.
            <CandidateProfile>
                ${candidateXML}
            </CandidateProfile>
            <CVContent>
                ${cvContent}
            </CVContent>
            Links to analyze:
            ${links
							.map(
								link =>
									`\nTitle: ${link.text}\nURL: ${link.url}\nContext: ${link.context}`,
							)
							.join('')}
        `;

		logger.info('Waiting for AI initial screening with structured output...');

		const generationConfig: GenerationConfig = {
			responseMimeType: 'application/json',
			responseSchema: initialMatchingSchema,
		};

		// Check rate limits before making AI call
		await this.checkRateLimits();

		const result = await this.model.generateContent({
			contents: [{role: 'user', parts: [{text: prompt}]}],
			generationConfig,
		});

		const usage = result.response.usageMetadata;
		if (usage) {
			this.recordUsage(usage);
			logger.debug('Token usage for deep dive analysis:', {
				prompt: usage.promptTokenCount,
				response: usage.candidatesTokenCount,
				total: usage.totalTokenCount,
			});
		}

		const responseText = result.response.text();
		return JSON.parse(responseText).recommendedPositions || [];
	}

	private async checkRateLimits(): Promise<void> {
		const {tpm, rpm, rpd} = this.modelLimits;
		const now = new Date();

		// Handle daily reset
		if (now.getTime() - this.usageStats.lastReset.getTime() > 86400000) {
			this.usageStats.dayTokens = 0;
			this.usageStats.lastDayCalls = 0;
			this.usageStats.lastReset = now;
		}

		// Check daily request limit
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

		// Check minute request limit
		if (rpm && this.usageStats.lastMinuteCalls >= rpm) {
			logger.warn(
				`Minute request limit (${rpm}) reached, waiting for next minute`,
			);
			await new Promise(resolve => setTimeout(resolve, 60000));
			this.usageStats.lastMinuteCalls = 0;
		}

		// Check minute token limit
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

		// Reset counters if more than a day has passed
		if (now.getTime() - this.usageStats.lastReset.getTime() > 86400000) {
			this.usageStats.dayTokens = 0;
			this.usageStats.lastDayCalls = 0;
			this.usageStats.lastReset = now;
		}

		// Update stats
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

		// Reset minute counters every minute
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

	private cleanup() {
		logger.debug('Starting cleanup...');

		// Log final usage stats
		const usageSummary = this.getUsageSummary();
		logger.info('🔢 Final AI usage statistics:', {
			usage: usageSummary.split('\n'),
		});

		// Clear state
		this.detailedJobContents.clear();
		this.initialMatches = [];
		this.scrapedJobs = [];
		this.cvContent = '';
		this.candidateXML = '';
		this.candidateInfo = null;

		logger.debug('Cleanup completed');
	}

	private async scrapeJobDetails(url: string): Promise<string> {
		logger.debug('Starting job detail scrape...', {url});
		const scrapeStart = Date.now();

		try {
			// Add randomized delay before each scrape
			await new Promise(resolve =>
				setTimeout(resolve, 1000 + Math.random() * 1000),
			);
			logger.debug('Starting scrape after delay...');

			let attempts = 0;
			const maxAttempts = 5; // More retries for job details
			const maxBackoff = 30000; // Max 30s backoff between retries
			let lastError: any;

			while (attempts < maxAttempts) {
				try {
					const result = await scrapeWebsite({
						url,
						options: {
							timeout: 120000, // 120s timeout for job details
							waitUntil: 'networkidle', // Full load strategy for detailed content
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
							{
								url,
								error,
							},
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

	private async performDeepDiveAnalysis(
		positions: Array<{title: string; url: string}>,
		cvContent: string,
		candidateInfo: Record<string, any>,
	): Promise<JobAnalysisResult[]> {
		// First perform a quick title-based screening
		const titleScreened = positions.filter(pos => {
			const title = pos.title.toLowerCase();
			// Skip obvious mismatches like "Read More" links
			if (
				title.length < 5 ||
				title.includes('read more') ||
				title.includes('apply')
			) {
				logger.debug(`Skipping non-job link: ${pos.title}`);
				return false;
			}
			return true;
		});

		logger.info(
			`Title screening reduced positions from ${positions.length} to ${titleScreened.length}`,
		);

		// Then prepare the valid positions for content analysis
		const validPositions = titleScreened
			.map(position => {
				const content = this.detailedJobContents.get(position.url);
				return content ? {...position, content} : null;
			})
			.filter((p): p is NonNullable<typeof p> => p !== null);

		if (validPositions.length === 0) {
			logger.warn('No positions with content to analyze');
			return [];
		}

		// Process in batches to stay within token limits
		const results: JobAnalysisResult[] = [];
		const batches: Array<typeof validPositions> = [];

		// Split into batches of BATCH_SIZE
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

				// Wait between batches to respect rate limits
				if (i < batches.length - 1) {
					await new Promise(resolve => setTimeout(resolve, 2000));
				}
			} catch (error: any) {
				logger.error(`Failed to process batch ${i + 1}:`, {
					error,
					batchSize: batch.length,
					jobs: batch.map(job => job.title),
				});

				if (error?.status === 429) {
					// Rate limit exceeded
					const retryDelay = this.extractRetryDelay(error) || 13000;
					logger.warn(
						`Rate limit hit, waiting ${retryDelay / 1000}s before retry...`,
					);
					await new Promise(resolve => setTimeout(resolve, retryDelay));

					// Retry this batch
					try {
						const retryResults = await this.analyzeJobBatch(
							batch,
							cvContent,
							candidateInfo,
						);
						results.push(...retryResults);
					} catch (retryError) {
						logger.error('Retry also failed:', retryError);
					}
				}
			}
		}

		// Sort all results by suitability score
		return results.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
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

<CandidateProfile>
    ${candidateXML}
</CandidateProfile>

<CVContent>
    ${cvContent}
</CVContent>

<JobsToAnalyze>
    ${batch
			.map(
				job => `
    <Job>
        <Title>${job.title}</Title>
        <URL>${job.url}</URL>
        <Content>${job.content}</Content>
    </Job>
    `,
			)
			.join('\n')}
</JobsToAnalyze>
`;

		logger.info('  ↳ Starting analysis of batch...');
		logger.debug('Preparing Gemini request:', {
			batchSize: batch.length,
			promptLength: prompt.length,
		});

		const generationConfig: GenerationConfig = {
			responseMimeType: 'application/json',
			responseSchema: deepDiveSchema,
		};

		// Check rate limits before making AI call
		await this.checkRateLimits();

		const result = await this.model.generateContent({
			contents: [{role: 'user', parts: [{text: prompt}]}],
			generationConfig,
		});

		const usage = result.response.usageMetadata;
		if (usage) {
			this.recordUsage(usage);
			logger.debug('Token usage for deep dive analysis:', {
				prompt: usage.promptTokenCount,
				response: usage.candidatesTokenCount,
				total: usage.totalTokenCount,
				summary: this.getUsageSummary(),
			});
		}

		logger.info('  ↳ Received Gemini response, processing results...');
		const analysis = JSON.parse(result.response.text());
		logger.debug('Analysis response structure:', {
			totalResults: analysis.analysisResults.length,
			hasExpectedFields: analysis.analysisResults.every(
				(r: any) =>
					r.title && r.url && r.goodFitReasons && r.considerationPoints,
			),
		});

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
