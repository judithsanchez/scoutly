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
	private model!: any;
	private systemRole = '';
	private firstSelectionTask = '';
	private jobPostDeepDive = '';

	constructor() {
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			throw new Error('GEMINI_API_KEY environment variable is required');
		}

		this.genAI = new GoogleGenerativeAI(apiKey);
		this.model = this.genAI.getGenerativeModel({
			model: 'gemini-1.5-flash',
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

			logger.info('📄 Step 1: Processing candidate CV...');
			const cvContent = await this.getCvContentAsText(cvUrl);
			logger.success(
				`✓ CV processed. Extracted ${cvContent.length} characters.`,
			);

			logger.info('📝 Step 2: Scraping job listings from', {url: jobBoardUrl});
			const jobsResult = await this.scrapeJobs(jobBoardUrl);
			if (jobsResult.error) {
				throw new Error(`Failed to scrape jobs: ${jobsResult.error}`);
			}
			// Get 3 random job samples
			const getRandomJobs = (jobs: ExtractedLink[], count: number) => {
				const shuffled = [...jobs].sort(() => Math.random() - 0.5);
				return shuffled.slice(0, count);
			};

			logger.info('📊 Initial Job Board Scrape Results:', {
				totalJobs: jobsResult.links.length,
				sampleJobs: getRandomJobs(jobsResult.links, 3).map(link => ({
					title: link.text,
					url: link.url,
				})),
			});

			if (jobsResult.links.length === 0) {
				logger.warn('No links found on the job board. Ending pipeline.');
				return [];
			}

			logger.info('🔍 Step 3: Performing initial job matching analysis');
			const matchedPositions = await this.performInitialMatching(
				jobsResult.links,
				cvContent,
				candidateInfo,
			);
			logger.info('📊 Initial AI Matching Results:', {
				totalMatches: matchedPositions.length,
				originalLinks: jobsResult.links.length,
			});

			if (matchedPositions.length === 0) {
				logger.info(
					'No potential matches found after initial screening. Ending pipeline.',
				);
				return [];
			}

			logger.info('🔬 Step 4: Starting deep dive analysis');
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
		cvContent: string,
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

				// Log the processed candidate information for deep dive analysis
				const candidateXML = this.objectToXML(candidateInfo);
				logger.debug('Processed Candidate Profile XML:', {
					stage: 'Deep Dive Analysis',
					position: position.title,
					xml: candidateXML,
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
				// Only include positions that pass the deep dive analysis
				if (analysis.suitabilityScore > 0) {
					results.push({...position, ...analysis});
					logger.success(`✓ Position passed analysis: "${position.title}"`);
				} else {
					logger.info(`✗ Position excluded by deep dive: "${position.title}"`);
				}
			} catch (error) {
				logger.error(`Failed to analyze position: ${position.title}`, error);
			}
		}

		logger.info('📊 Deep Dive Analysis Results:', {
			inputPositions: total,
			acceptedPositions: results.length,
		});

		return results.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
	}
}
