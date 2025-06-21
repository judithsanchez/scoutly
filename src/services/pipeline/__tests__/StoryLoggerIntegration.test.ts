/**
 * Integration test for story logger across all pipeline steps
 */

import {describe, it, expect, vi, beforeEach} from 'vitest';
import {JobMatchingContext} from '../JobMatchingContext';
import {JobMatchingPipeline} from '../JobMatchingPipeline';
import {CompanyScrapingStep} from '../steps/CompanyScrapingStep';
import {CvProcessingStep} from '../steps/CvProcessingStep';
import {CandidateProfileStep} from '../steps/CandidateProfileStep';
import {InitialMatchingStep} from '../steps/InitialMatchingStep';
import {JobDetailsStep} from '../steps/JobDetailsStep';
import {DeepAnalysisStep} from '../steps/DeepAnalysisStep';
import {ResultsStorageStep} from '../steps/ResultsStorageStep';
import type {ICompany} from '@/models/Company';
import type {UsageStats} from '@/utils/rateLimiting';
import type {AIProcessorConfig} from '@/utils/aiProcessor';
import type {IGeminiRateLimit} from '@/config/rateLimits';

// Mock external dependencies
vi.mock('@/utils/jobScraper');
vi.mock('@/utils/cvProcessor');
vi.mock('@/utils/aiProcessor');
vi.mock('@/utils/rateLimiting');
vi.mock('../../scrapeHistoryService');
vi.mock('../../userService');
vi.mock('../../tokenUsageService'); // Add token usage service mock
vi.mock('@/models/SavedJob');

// Comprehensive Logger mock to prevent any database operations
vi.mock('@/utils/logger', () => ({
	Logger: vi.fn().mockImplementation(() => ({
		info: vi.fn().mockResolvedValue(undefined),
		debug: vi.fn().mockResolvedValue(undefined),
		error: vi.fn().mockResolvedValue(undefined),
		warn: vi.fn().mockResolvedValue(undefined),
		saveBufferedLogs: vi.fn().mockResolvedValue(undefined),
	})),
}));

describe('Story Logger Integration', () => {
	let context: JobMatchingContext;
	let pipeline: JobMatchingPipeline;

	const mockCompanies: ICompany[] = [
		{
			id: 'company1',
			_id: 'obj1' as any,
			companyID: 'TECH_CORP_001', // Add the required companyID field
			company: 'TechCorp',
			careers_url: 'https://techcorp.com/careers',
		} as ICompany,
	];

	const mockUsageStats: UsageStats = {
		minuteTokens: 0,
		dayTokens: 0,
		totalTokens: 0,
		calls: 0,
		lastMinuteCalls: 0,
		lastDayCalls: 0,
		lastReset: new Date(),
	};

	const mockAiConfig: AIProcessorConfig = {
		model: 'gemini-1.5-flash',
		modelLimits: {
			modelName: 'gemini-1.5-flash',
			rpm: 15,
			rpd: 1500,
			tpm: 32000,
			tpd: 50000,
		} as IGeminiRateLimit,
		templates: {
			systemRole: 'Mock system role template',
			firstSelectionTask: 'Mock first selection template',
			jobPostDeepDive: 'Mock deep dive template',
		},
		usageStats: {
			minuteTokens: 0,
			dayTokens: 0,
			totalTokens: 0,
			calls: 0,
			lastMinuteCalls: 0,
			lastDayCalls: 0,
			lastReset: new Date(),
		},
	};

	const mockRateLimits: IGeminiRateLimit = {
		modelName: 'gemini-1.5-flash',
		rpm: 15,
		rpd: 1500,
		tpm: 32000,
		tpd: 50000,
	};

	beforeEach(async () => {
		vi.clearAllMocks();

		// Mock TokenUsageService to prevent database calls
		const {TokenUsageService} = await import('../../tokenUsageService');
		vi.mocked(TokenUsageService.recordUsage).mockResolvedValue({
			id: 'mock-token-usage-id',
			operation: 'initial_matching',
			estimatedTokens: 150,
			actualTokens: 150,
			timestamp: new Date(),
		} as any);

		context = new JobMatchingContext(
			mockCompanies,
			'https://example.com/cv.pdf',
			{name: 'John Doe', skills: ['JavaScript', 'TypeScript']},
			'john@example.com',
			mockUsageStats,
			mockAiConfig,
			mockRateLimits,
		);

		pipeline = new JobMatchingPipeline();
	});

	it('should collect story entries from all pipeline steps', async () => {
		// Mock the external functions to simulate successful execution
		const {getCvContentAsText} = await import('@/utils/cvProcessor');
		const {scrapeJobsWithFiltering, scrapeJobDetails} = await import(
			'@/utils/jobScraper'
		);
		const {performInitialMatching, analyzeJobBatch} = await import(
			'@/utils/aiProcessor'
		);
		const {checkDailyReset, checkRateLimits} = await import(
			'@/utils/rateLimiting'
		);
		const {UserService} = await import('../../userService');
		const {ScrapeHistoryService} = await import('../../scrapeHistoryService');

		vi.mocked(getCvContentAsText).mockResolvedValue(
			'Mock CV content with skills and experience',
		);
		vi.mocked(scrapeJobsWithFiltering).mockResolvedValue({
			content: 'Mock careers page content',
			links: [
				{
					url: 'https://techcorp.com/job1',
					text: 'Software Engineer',
					context: 'job listing',
					isExternal: false,
				},
				{
					url: 'https://techcorp.com/job2',
					text: 'Frontend Developer',
					context: 'job listing',
					isExternal: false,
				},
			],
		});
		vi.mocked(performInitialMatching).mockResolvedValue([
			{title: 'Software Engineer', url: 'https://techcorp.com/job1'},
		]);
		vi.mocked(scrapeJobDetails).mockResolvedValue(
			new Map([
				[
					'https://techcorp.com/job1',
					'Detailed job description for Software Engineer',
				],
			]),
		);
		vi.mocked(analyzeJobBatch).mockResolvedValue({
			results: [
				{
					title: 'Software Engineer',
					url: 'https://techcorp.com/job1',
					suitabilityScore: 85,
					goodFitReasons: ['Strong technical skills'],
					considerationPoints: [],
					stretchGoals: [],
				},
			],
			tokenUsage: {
				promptTokenCount: 100,
				candidatesTokenCount: 50,
				totalTokenCount: 150,
			},
		});
		vi.mocked(checkDailyReset).mockReturnValue(mockUsageStats);
		vi.mocked(checkRateLimits).mockResolvedValue(undefined);
		vi.mocked(UserService.getUserByEmail).mockResolvedValue({
			id: 'user1',
		} as any);
		vi.mocked(ScrapeHistoryService.getLastScrape).mockResolvedValue(null);
		vi.mocked(ScrapeHistoryService.recordScrape).mockResolvedValue({
			id: 'mock-scrape-id',
			timestamp: new Date(),
		} as any);

		// Mock SavedJob.find to return empty array (no duplicates)
		const {SavedJob} = await import('@/models/SavedJob');
		vi.mocked(SavedJob.find).mockResolvedValue([]);
		vi.mocked(SavedJob.prototype.save).mockResolvedValue({} as any);

		// Add all pipeline steps
		pipeline
			.addStep(new CvProcessingStep())
			.addStep(new CandidateProfileStep())
			.addStep(new CompanyScrapingStep())
			.addStep(new InitialMatchingStep())
			.addStep(new JobDetailsStep())
			.addStep(new DeepAnalysisStep())
			.addStep(new ResultsStorageStep());

		// Execute the pipeline
		const result = await pipeline.execute(context);

		// Verify pipeline completed successfully
		expect(result.summary.executedSteps).toBe(7);
		expect(result.summary.failedSteps).toBe(0);

		// Verify story entries were collected
		const storyEntries = context.storyLogs;
		expect(storyEntries.length).toBeGreaterThan(0);

		// Check that each step contributed to the story
		const stepNames = storyEntries.map(entry => entry.stepName);
		expect(stepNames).toContain('CvProcessing');
		expect(stepNames).toContain('CandidateProfile');
		expect(stepNames).toContain('CompanyScraping');
		expect(stepNames).toContain('InitialMatching');
		expect(stepNames).toContain('JobDetails');
		expect(stepNames).toContain('DeepAnalysis');
		expect(stepNames).toContain('ResultsStorage');

		// Verify story entries have expected structure
		storyEntries.forEach(entry => {
			expect(entry).toHaveProperty('timestamp');
			expect(entry).toHaveProperty('level');
			expect(entry).toHaveProperty('stepName');
			expect(entry).toHaveProperty('message');
			expect(entry.timestamp).toBeInstanceOf(Date);
			expect(['info', 'success', 'warn', 'error', 'debug']).toContain(
				entry.level,
			);
		});

		// Verify story progression tells a coherent narrative
		const cvProcessingEntries = storyEntries.filter(
			e => e.stepName === 'CvProcessing',
		);
		expect(
			cvProcessingEntries.some(e =>
				e.message.includes('CV processed successfully'),
			),
		).toBe(true);

		const scrapingEntries = storyEntries.filter(
			e => e.stepName === 'CompanyScraping',
		);
		expect(
			scrapingEntries.some(e =>
				e.message.includes('Company scraping completed'),
			),
		).toBe(true);

		const analysisEntries = storyEntries.filter(
			e => e.stepName === 'DeepAnalysis',
		);
		expect(
			analysisEntries.some(e =>
				e.message.includes('Deep AI analysis completed'),
			),
		).toBe(true);

		const storageEntries = storyEntries.filter(
			e => e.stepName === 'ResultsStorage',
		);
		expect(
			storageEntries.some(e => e.message.includes('Successfully saved')),
		).toBe(true);
	}, 15000); // 15 second timeout

	it('should handle story logging during errors gracefully', async () => {
		// Mock CV processing to fail
		const {getCvContentAsText} = await import('@/utils/cvProcessor');
		vi.mocked(getCvContentAsText).mockRejectedValue(
			new Error('CV download failed'),
		);

		// Add only CV processing step to isolate the error
		pipeline.addStep(new CvProcessingStep());

		// Execute pipeline with error handling
		await expect(pipeline.execute(context)).rejects.toThrow(
			'CV processing failed',
		);

		// Verify story still captured the error
		const storyEntries = context.storyLogs;
		expect(storyEntries.length).toBeGreaterThan(0);

		const errorEntries = storyEntries.filter(e => e.level === 'error');
		expect(errorEntries.length).toBeGreaterThan(0);
		expect(
			errorEntries.some(e => e.message.includes('CV download failed')),
		).toBe(true);
	});

	it('should save story to database on cleanup', async () => {
		// Create a spy to track saveStory calls - mock it to resolve immediately
		const saveStorySpy = vi
			.spyOn(context.storyLogger, 'saveStory')
			.mockImplementation(async () => {
				// Simulate what the real saveStory does but without database calls
				if (context.storyLogs.length > 0) {
					console.log(
						`📚 Pipeline story saved with ${context.storyLogs.length} entries`,
					);
				}
			});

		// Add some story entries
		context.storyLogger.addToStory('info', 'TestStep', 'Test message');

		// Call cleanup
		await context.cleanup();

		// Verify saveStory was called
		expect(saveStorySpy).toHaveBeenCalledOnce();

		// Verify story has entries
		const story = context.storyLogs;
		expect(story).toHaveLength(1);
		expect(story[0].stepName).toBe('TestStep');
		expect(story[0].message).toBe('Test message');
		expect(story[0].level).toBe('info');
	}, 10000); // 10 second timeout
});
