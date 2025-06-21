import {describe, it, expect, vi, beforeEach} from 'vitest';
import {PipelineStoryLogger} from '../utils/PipelineStoryLogger';
import {Logger} from '@/utils/logger';

// Mock the Logger
vi.mock('@/utils/logger');

describe('PipelineStoryLogger', () => {
	let mockLogger: any;
	let storyLogger: PipelineStoryLogger;
	const executionId = 'test-execution-123';

	beforeEach(() => {
		vi.clearAllMocks();
		mockLogger = {
			info: vi.fn(),
			saveBufferedLogs: vi.fn(),
		};
		storyLogger = new PipelineStoryLogger(mockLogger, executionId);
	});

	it('should collect story entries in order', () => {
		storyLogger.addToStory('info', 'TestStep', 'First message');
		storyLogger.addToStory('success', 'TestStep', 'Second message', {count: 5});
		storyLogger.addToStory('error', 'ErrorStep', 'Error occurred', {
			error: 'test',
		});

		const story = storyLogger.getStory();

		expect(story).toHaveLength(3);
		expect(story[0]).toMatchObject({
			level: 'info',
			stepName: 'TestStep',
			message: 'First message',
		});
		expect(story[1]).toMatchObject({
			level: 'success',
			stepName: 'TestStep',
			message: 'Second message',
			data: {count: 5},
		});
		expect(story[2]).toMatchObject({
			level: 'error',
			stepName: 'ErrorStep',
			message: 'Error occurred',
			data: {error: 'test'},
		});
	});

	it('should include timestamps in story entries', () => {
		const beforeTime = new Date();
		storyLogger.addToStory('info', 'TestStep', 'Test message');
		const afterTime = new Date();

		const story = storyLogger.getStory();
		const entry = story[0];

		expect(entry.timestamp).toBeInstanceOf(Date);
		expect(entry.timestamp.getTime()).toBeGreaterThanOrEqual(
			beforeTime.getTime(),
		);
		expect(entry.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
	});

	it('should include metrics when provided', () => {
		const metrics = {duration: 1500, tokens: 250, count: 10};
		storyLogger.addToStory(
			'info',
			'TestStep',
			'Test with metrics',
			{},
			metrics,
		);

		const story = storyLogger.getStory();
		expect(story[0].metrics).toEqual(metrics);
	});

	it('should save complete story to logger', async () => {
		storyLogger.addToStory('info', 'Step1', 'Starting process');
		storyLogger.addToStory('success', 'Step2', 'Process completed', {
			results: 42,
		});

		await storyLogger.saveStory();

		expect(mockLogger.info).toHaveBeenCalledWith(
			'Pipeline execution complete story',
			expect.objectContaining({
				executionId,
				context: 'Pipeline-Complete-Story',
				totalSteps: 2,
				logs: expect.arrayContaining([
					expect.objectContaining({
						stepName: 'Step1',
						message: 'Starting process',
					}),
					expect.objectContaining({
						stepName: 'Step2',
						message: 'Process completed',
					}),
				]),
				narrative: expect.stringContaining('PIPELINE EXECUTION STORY'),
				metrics: expect.objectContaining({
					totalLogEntries: 2,
					errorCount: 0,
					successCount: 1,
				}),
			}),
		);
		expect(mockLogger.saveBufferedLogs).toHaveBeenCalled();
	});

	it('should calculate metrics correctly', async () => {
		storyLogger.addToStory('info', 'Step1', 'Start', {}, {tokens: 100});
		storyLogger.addToStory('error', 'Step2', 'Error occurred');
		storyLogger.addToStory('success', 'Step3', 'Success', {}, {tokens: 200});
		storyLogger.addToStory('success', 'Step4', 'Another success');

		await storyLogger.saveStory();

		const savedData = mockLogger.info.mock.calls[0][1];
		expect(savedData.metrics).toMatchObject({
			totalTokensUsed: 300,
			errorCount: 1,
			successCount: 2,
			totalLogEntries: 4,
		});
		expect(savedData.metrics.totalDurationMs).toBeGreaterThanOrEqual(0);
	});

	it('should handle empty story gracefully', async () => {
		await storyLogger.saveStory();

		expect(mockLogger.info).not.toHaveBeenCalled();
		expect(mockLogger.saveBufferedLogs).not.toHaveBeenCalled();
	});

	it('should return a copy of the story array', () => {
		storyLogger.addToStory('info', 'TestStep', 'Test message');

		const story1 = storyLogger.getStory();
		const story2 = storyLogger.getStory();

		expect(story1).not.toBe(story2); // Different object references
		expect(story1).toEqual(story2); // Same content
	});

	it('should create readable narrative text', async () => {
		storyLogger.addToStory(
			'info',
			'CompanyScraping',
			'Starting to scrape Google',
		);
		storyLogger.addToStory('success', 'CompanyScraping', 'Found 25 job links', {
			count: 25,
		});
		storyLogger.addToStory('info', 'AIMatching', 'Running initial matching');

		await storyLogger.saveStory();

		const savedData = mockLogger.info.mock.calls[0][1];
		const narrative = savedData.narrative;

		expect(narrative).toContain('PIPELINE EXECUTION STORY');
		expect(narrative).toContain('CompanyScraping');
		expect(narrative).toContain('Starting to scrape Google');
		expect(narrative).toContain('Found 25 job links');
		expect(narrative).toContain('AIMatching');
		expect(narrative).toContain('Running initial matching');
	});
});
