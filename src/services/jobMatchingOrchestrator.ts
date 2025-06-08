import {
	scrapeWebsite,
	type ExtractedLink,
	type ScrapeResult,
} from '@/utils/scraper';
import {Logger} from '@/utils/logger';
import {GoogleGenerativeAI} from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';

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
			model: 'gemini-2.0-flash',
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
			return obj.map(item => this.objectToXML(item, parentTag)).join('\n');
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
		return `<${tag}>${obj}</${tag}>\n`;
	}

	async orchestrateJobMatching(
		jobBoardUrl: string,
		cvUrl: string,
		candidateInfo: Record<string, any>,
	): Promise<JobAnalysisResult[]> {
		try {
			const startTime = Date.now();
			logger.info('🚀 Starting job matching pipeline');

			logger.info('📝 Step 1: Scraping job listings from', jobBoardUrl);
			const scrapeStartTime = Date.now();
			const jobsResult = await this.scrapeJobs(jobBoardUrl);
			if (jobsResult.error) {
				throw new Error(`Failed to scrape jobs: ${jobsResult.error}`);
			}
			logger.info(
				`✓ Scraping completed in ${
					(Date.now() - scrapeStartTime) / 1000
				}s. Found ${jobsResult.links.length} links.`,
			);

			logger.info('🔍 Step 2: Performing initial job matching analysis');
			const matchStartTime = Date.now();
			const matchedPositions = await this.performInitialMatching(
				jobsResult.links,
				cvUrl,
				candidateInfo,
			);
			logger.info(
				`✓ Initial matching completed in ${
					(Date.now() - matchStartTime) / 1000
				}s`,
			);
			logger.info(
				`Found ${matchedPositions.length} potential matches out of ${jobsResult.links.length} total positions`,
			);

			logger.info('🔬 Step 3: Starting deep dive analysis');
			logger.info(
				`Will analyze ${matchedPositions.length} positions sequentially`,
			);
			const deepDiveStartTime = Date.now();
			const analysisResults = await this.performDeepDiveAnalysis(
				matchedPositions,
				cvUrl,
				candidateInfo,
			);
			logger.info(
				`✓ Deep dive completed in ${(Date.now() - deepDiveStartTime) / 1000}s`,
			);

			const totalTime = (Date.now() - startTime) / 1000;
			logger.info(`🏁 Pipeline completed in ${totalTime}s`);
			logger.info(`Total positions analyzed: ${jobsResult.links.length}`);
			logger.info(`Matches after initial filter: ${matchedPositions.length}`);
			logger.info(`Final matches with analysis: ${analysisResults.length}`);

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
		cvUrl: string,
		candidateInfo: Record<string, any>,
	): Promise<Array<{title: string; url: string}>> {
		logger.info(`Preparing to analyze ${links.length} job listings`);
		logger.info('Generating analysis prompt with candidate profile and links');

		const prompt = `
${this.systemRole}

${this.firstSelectionTask}

Analyze these job postings based on the candidate's profile:

<CandidateProfile>
${this.objectToXML(candidateInfo)}
</CandidateProfile>

CV URL: ${cvUrl}

Links to analyze:
${links
	.map(
		link => `
Title: ${link.text}
URL: ${link.url}
Context: ${link.context}
`,
	)
	.join('\n')}
`;

		logger.info('Waiting for AI initial screening...');
		const startTime = Date.now();
		const result = await this.model.generateContent(prompt);

		const duration = (Date.now() - startTime) / 1000;
		const response = JSON.parse(result.response.text());
		const recommendations = response.recommendedPositions || [];

		logger.info(
			`Initial screening found ${recommendations.length} potential matches in ${duration}s`,
		);
		return recommendations;
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
		cvUrl: string,
		candidateInfo: Record<string, any>,
	): Promise<JobAnalysisResult[]> {
		const results: JobAnalysisResult[] = [];
		const total = positions.length;
		let current = 0;

		for (const position of positions) {
			current++;
			try {
				logger.info(
					`[${current}/${total}] 🔍 Analyzing position: ${position.title}`,
				);
				const startTime = Date.now();

				logger.info(`  ↳ Scraping job details from ${position.url}`);
				const jobContent = await this.scrapeJobDetails(position.url);
				logger.info('  ↳ Generating AI analysis prompt');

				const prompt = `
${this.systemRole}

${this.jobPostDeepDive}

Candidate Profile:
<CandidateProfile>
${this.objectToXML(candidateInfo)}
</CandidateProfile>

CV URL: ${cvUrl}

Job Posting Content:
${jobContent}
`;

				logger.info('  ↳ Waiting for AI analysis...');
				const result = await this.model.generateContent(prompt);

				const duration = (Date.now() - startTime) / 1000;
				const analysis = JSON.parse(result.response.text());

				results.push({
					title: position.title,
					url: position.url,
					goodFitReasons: analysis.goodFitReasons || [],
					considerationPoints: analysis.considerationPoints || [],
					stretchGoals: analysis.stretchGoals || [],
					suitabilityScore: analysis.suitabilityScore || 0,
				});

				logger.success(
					`✓ Completed analysis for "${position.title}" (Score: ${
						analysis.suitabilityScore || 0
					}/100) in ${duration}s`,
				);
			} catch (error) {
				logger.error(`Failed to analyze position: ${position.title}`, error);
			}
		}

		return results.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
	}
}
