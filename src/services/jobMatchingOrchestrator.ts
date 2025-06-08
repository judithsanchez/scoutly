import {
	scrapeWebsite,
	type ExtractedLink,
	type ScrapeResult,
} from '@/utils/scraper';
import {Logger} from '@/utils/logger';
import {
	GoogleGenerativeAI,
	GenerationConfig,
	Part,
} from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
import {initialMatchingSchema, deepDiveSchema} from '@/utils/geminiSchemas';

const logger = new Logger('JobMatchingOrchestrator');

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
	private model!: any; // In a stricter setup, you'd type this as GenerativeModel
	private systemRole = '';
	private firstSelectionTask = '';
	private jobPostDeepDive = '';

	constructor() {
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			throw new Error('GEMINI_API_KEY environment variable is required');
		}

		this.genAI = new GoogleGenerativeAI(apiKey);
		// CHANGED: Use a powerful model that excels at file processing
		this.model = this.genAI.getGenerativeModel({
			model: 'gemini-1.5-pro-latest',
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

	private objectToXML(obj: any, parentTag?: string): string {
		if (obj === null || obj === undefined) return '';
		if (Array.isArray(obj)) {
			return obj.map(item => this.objectToXML(item, parentTag)).join('');
		}
		if (typeof obj === 'object') {
			let xml = '';
			for (const [key, value] of Object.entries(obj)) {
				const tag = key.replace(/[^a-zA-Z0-9]/g, '');
				xml += this.objectToXML(value, tag);
			}
			return xml;
		}
		const tag = parentTag?.replace(/[^a-zA-Z0-9]/g, '') || 'value';
		return `<${tag}>${obj}</${tag}>`;
	}

	// ADDED: New method to process the CV from a Google Drive URL
	private async getCvContentAsText(cvUrl: string): Promise<string> {
		logger.info('Processing CV from URL...', {url: cvUrl});
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

			// NOTE: This requires the Google Drive file to be publicly accessible
			const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

			const response = await fetch(downloadUrl);
			if (!response.ok) {
				throw new Error(`Failed to download file: ${response.statusText}`);
			}

			const pdfBuffer = await response.arrayBuffer();

			const pdfPart: Part = {
				inlineData: {
					data: Buffer.from(pdfBuffer).toString('base64'),
					mimeType: 'application/pdf',
				},
			};

			const prompt =
				'Extract all text from this PDF document. Focus on skills, experiences, and project details.';

			const result = await this.model.generateContent({
				contents: [{role: 'user', parts: [pdfPart, {text: prompt}]}],
			});

			const cvText = result.response.text();
			logger.success('Successfully extracted text content from CV.');
			return cvText;
		} catch (error) {
			logger.error('Failed to process CV from Google Drive link.', error);
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

			// ADDED: Process CV at the beginning of the pipeline
			logger.info('Processing candidate CV...');
			const cvContent = await this.getCvContentAsText(cvUrl);

			logger.info('📝 Step 1: Scraping job listings from', {url: jobBoardUrl});
			const jobsResult = await this.scrapeJobs(jobBoardUrl);
			if (jobsResult.error) {
				throw new Error(`Failed to scrape jobs: ${jobsResult.error}`);
			}
			logger.info(
				`✓ Scraping completed. Found ${jobsResult.links.length} links.`,
			);

			if (jobsResult.links.length === 0) {
				logger.warn('No links found on the job board. Ending pipeline.');
				return [];
			}

			logger.info('🔍 Step 2: Performing initial job matching analysis');
			// CHANGED: Pass cvContent instead of cvUrl
			const matchedPositions = await this.performInitialMatching(
				jobsResult.links,
				cvContent,
				candidateInfo,
			);
			logger.info(`Found ${matchedPositions.length} potential matches.`);

			if (matchedPositions.length === 0) {
				logger.info(
					'No potential matches found after initial screening. Ending pipeline.',
				);
				return [];
			}

			logger.info('🔬 Step 3: Starting deep dive analysis');
			// CHANGED: Pass cvContent instead of cvUrl
			const analysisResults = await this.performDeepDiveAnalysis(
				matchedPositions,
				cvContent,
				candidateInfo,
			);

			const totalTime = (Date.now() - startTime) / 1000;
			logger.info(`🏁 Pipeline completed in ${totalTime}s`);
			return analysisResults;
		} catch (error) {
			logger.error('Error in job matching pipeline:', error);
			throw error;
		}
	}

	private async scrapeJobs(url: string): Promise<ScrapeResult> {
		return await scrapeWebsite({url});
	}

	private async performInitialMatching(
		links: ExtractedLink[],
		cvContent: string, // CHANGED: Now accepts CV text content
		candidateInfo: Record<string, any>,
	): Promise<Array<{title: string; url: string}>> {
		// CHANGED: Prompt now includes the full CV content
		const prompt = `
            ${this.systemRole}
            ${this.firstSelectionTask}
            Analyze these job postings based on the candidate's profile and the following CV content.
            <CandidateProfile>
                ${this.objectToXML(candidateInfo)}
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

		const result = await this.model.generateContent({
			contents: [{role: 'user', parts: [{text: prompt}]}],
			generationConfig,
		});

		const responseText = result.response.text();
		return JSON.parse(responseText).recommendedPositions || [];
	}

	private async scrapeJobDetails(url: string): Promise<string> {
		const result = await scrapeWebsite({url});
		if (result.error) {
			throw new Error(`Failed to scrape job details: ${result.error}`);
		}
		return result.content;
	}

	private async performDeepDiveAnalysis(
		positions: Array<{title: string; url: string}>,
		cvContent: string, // CHANGED: Now accepts CV text content
		candidateInfo: Record<string, any>,
	): Promise<JobAnalysisResult[]> {
		const results: JobAnalysisResult[] = [];
		const total = positions.length;

		for (const [index, position] of positions.entries()) {
			try {
				logger.info(
					`[${index + 1}/${total}] 🔍 Analyzing position: ${position.title}`,
				);

				const jobContent = await this.scrapeJobDetails(position.url);

				// CHANGED: Prompt now includes the full CV content
				const prompt = `
                    ${this.systemRole}
                    ${this.jobPostDeepDive}
                    <CandidateProfile>
                        ${this.objectToXML(candidateInfo)}
                    </CandidateProfile>
                    <CVContent>
                        ${cvContent}
                    </CVContent>
                    Job Posting Content (HTML):
                    ${jobContent}
                `;

				logger.info('  ↳ Waiting for AI analysis...');

				const generationConfig: GenerationConfig = {
					responseMimeType: 'application/json',
					responseSchema: deepDiveSchema,
				};

				const result = await this.model.generateContent({
					contents: [{role: 'user', parts: [{text: prompt}]}],
					generationConfig,
				});

				const analysis = JSON.parse(result.response.text());
				results.push({...position, ...analysis});
				logger.success(`✓ Completed analysis for "${position.title}"`);
			} catch (error) {
				logger.error(`Failed to analyze position: ${position.title}`, error);
			}
		}

		return results.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
	}
}
