/**
 * Pipeline infrastructure types and interfaces for the Job Matching Orchestrator
 */

import {ICompany} from '@/models/Company';
import {ExtractedLink} from '@/utils/scraper';
import {JobAnalysisResult, AIProcessorConfig} from '@/utils/aiProcessor';
import {UsageStats} from '@/utils/rateLimiting';
import {IGeminiRateLimit} from '@/config/rateLimits';
import {TokenOperation} from '@/models/TokenUsage';
import {Logger} from '@/utils/logger';

/**
 * Story log entry for narrative pipeline logging
 */
export interface StoryLogEntry {
	timestamp: Date;
	level: 'info' | 'warn' | 'error' | 'success' | 'debug';
	stepName: string;
	message: string;
	data?: Record<string, any>;
	metrics?: {
		duration?: number;
		count?: number;
		tokens?: number;
		[key: string]: any;
	};
}

/**
 * Helper type for adding story logs to context
 */
export interface StoryLogger {
	addToStory(
		level: StoryLogEntry['level'],
		stepName: string,
		message: string,
		data?: Record<string, any>,
		metrics?: StoryLogEntry['metrics'],
	): void;
	getStory(): StoryLogEntry[];
	saveStory(): Promise<void>;
}

/**
 * Shared context passed between all pipeline steps
 */
export interface PipelineContext {
	// Input data
	companies: ICompany[];
	cvUrl: string;
	candidateInfo: Record<string, any>;
	userEmail: string;
	/**
	 * Unique user identifier for all DB operations (required)
	 */
	userId: string;

	// Shared logger - all steps should use this for unified logging
	logger: Logger;

	// Story logging - collect narrative for complete pipeline story
	storyLogs: StoryLogEntry[];
	storyLogger: StoryLogger;

	// Processing state - updated by steps
	cvContent?: string;
	candidateProfile?: Record<string, any>;
	scrapedData?: Map<string, ExtractedLink[]>;
	matchedJobs?: Array<{title: string; url: string}>;
	jobDetails?: Map<string, string>;
	analysisResults?: Map<string, JobAnalysisResult[]>;

	// Results tracking for accurate count reporting
	savedJobsCount?: number;
	savedJobsMap?: Map<string, JobAnalysisResult[]>;

	// Configuration and tracking
	usageStats: UsageStats;
	aiConfig: AIProcessorConfig;
	modelLimits: IGeminiRateLimit;
	currentUserEmail: string;
	currentCompanyId: string;
	currentCompanyName: string;

	// Context methods
	setCompanyContext(companyId: string, companyName: string): void;
	recordUsage(usage: TokenUsage, operation?: TokenOperation): Promise<void>;
	cleanup(): Promise<void>;
}

/**
 * Token usage information for recording
 */
export interface TokenUsage {
	promptTokenCount: number;
	candidatesTokenCount: number;
	totalTokenCount: number;
}

/**
 * Individual pipeline step interface
 */
export interface PipelineStep {
	readonly name: string;
	readonly description?: string;

	/**
	 * Execute the step with the given context
	 * @param context - Shared pipeline context
	 * @returns Updated context
	 */
	execute(context: PipelineContext): Promise<PipelineContext>;

	/**
	 * Check if this step can be skipped based on context
	 * @param context - Current pipeline context
	 * @returns True if step can be skipped
	 */
	canSkip?(context: PipelineContext): boolean;

	/**
	 * Handle errors that occur during step execution
	 * @param error - The error that occurred
	 * @param context - Current pipeline context
	 */
	onError?(error: Error, context: PipelineContext): Promise<void>;

	/**
	 * Validate context before executing this step
	 * @param context - Current pipeline context
	 * @throws Error if context is invalid
	 */
	validate?(context: PipelineContext): void;
}

/**
 * Pipeline execution options
 */
export interface PipelineOptions {
	/**
	 * Continue execution even if a step fails
	 */
	continueOnError?: boolean;

	/**
	 * Skip steps that can be skipped
	 */
	allowSkipping?: boolean;

	/**
	 * Timeout for the entire pipeline execution (ms)
	 */
	timeoutMs?: number;

	/**
	 * Custom logger instance
	 */
	logger?: any;
}

/**
 * Pipeline execution result
 */
export interface PipelineResult {
	/**
	 * Final context after all steps
	 */
	context: PipelineContext;

	/**
	 * Execution summary
	 */
	summary: {
		totalSteps: number;
		executedSteps: number;
		skippedSteps: number;
		failedSteps: number;
		executionTimeMs: number;
	};

	/**
	 * Step execution details
	 */
	stepResults: Array<{
		stepName: string;
		status: 'executed' | 'skipped' | 'failed';
		executionTimeMs: number;
		error?: Error;
	}>;
}
