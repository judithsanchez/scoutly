/**
 * Shared context implementation for the Job Matching Pipeline
 */

import {Logger} from '@/utils/logger';
import {TokenUsageService} from '../tokenUsageService';
import {TokenOperation} from '@/models/TokenUsage';
import {
	checkDailyReset,
	updateUsageStats,
	getUsageSummary,
} from '@/utils/rateLimiting';
import crypto from 'crypto';
import type {PipelineContext, TokenUsage} from './types';
import type {ICompany} from '@/models/Company';
import type {ExtractedLink} from '@/utils/scraper';
import type {JobAnalysisResult, AIProcessorConfig} from '@/utils/aiProcessor';
import type {UsageStats} from '@/utils/rateLimiting';
import type {IGeminiRateLimit} from '@/config/rateLimits';

const logger = new Logger('JobMatchingContext');

export class JobMatchingContext implements PipelineContext {
	// Input data
	companies: ICompany[];
	cvUrl: string;
	candidateInfo: Record<string, any>;
	userEmail: string;

	// Processing state
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

	constructor(
		companies: ICompany[],
		cvUrl: string,
		candidateInfo: Record<string, any>,
		userEmail: string,
		usageStats: UsageStats,
		aiConfig: AIProcessorConfig,
		modelLimits: IGeminiRateLimit,
	) {
		this.companies = companies;
		this.cvUrl = cvUrl;
		this.candidateInfo = candidateInfo;
		this.userEmail = userEmail;
		this.usageStats = usageStats;
		this.aiConfig = aiConfig;
		this.modelLimits = modelLimits;
		this.currentUserEmail = userEmail;
		this.currentCompanyId = '';
		this.currentCompanyName = '';

		// Initialize processing state
		this.scrapedData = new Map();
		this.jobDetails = new Map();
		this.analysisResults = new Map();
		this.savedJobsCount = 0;
		this.savedJobsMap = new Map();
	}

	/**
	 * Set the current company context for token usage tracking
	 */
	setCompanyContext(companyId: string, companyName: string): void {
		this.currentCompanyId = companyId;
		this.currentCompanyName = companyName;
		logger.debug(`Set company context: ${companyName} (${companyId})`);
	}

	/**
	 * Set the current company context for accurate usage tracking
	 */
	setCurrentCompany(companyId: string, companyName: string): void {
		this.currentCompanyId = companyId;
		this.currentCompanyName = companyName;
		logger.debug('Updated company context for usage tracking', {
			companyId,
			companyName,
			userEmail: this.currentUserEmail,
		});
	}

	/**
	 * Record token usage for the current operation
	 */
	async recordUsage(
		usage: TokenUsage,
		operation: TokenOperation = TokenOperation.INITIAL_MATCHING,
	): Promise<void> {
		try {
			// Use utility to check and apply daily reset and update stats
			this.usageStats = checkDailyReset(this.usageStats);
			this.usageStats = updateUsageStats(
				this.usageStats,
				usage.totalTokenCount,
			);

			logger.debug('Recording token usage in database', {
				operation,
				tokens: usage.totalTokenCount,
				userEmail: this.currentUserEmail,
				companyId: this.currentCompanyId,
				companyName: this.currentCompanyName,
				hasCompanyContext: !!(this.currentUserEmail && this.currentCompanyId),
			});

			// Record usage in database - use first company if no specific company context
			const targetCompanyId =
				this.currentCompanyId ||
				(this.companies.length > 0 ? this.companies[0].companyID : 'unknown');
			const targetCompanyName =
				this.currentCompanyName ||
				(this.companies.length > 0
					? this.companies[0].company
					: 'Unknown Company');

			if (this.currentUserEmail && targetCompanyId !== 'unknown') {
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
					companyId: targetCompanyId,
					companyName: targetCompanyName,
				});

				logger.info('✅ Token usage recorded successfully in database', {
					operation,
					tokens: usage.totalTokenCount,
					companyId: targetCompanyId,
					companyName: targetCompanyName,
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

			// Reset minute counters after 60 seconds
			setTimeout(() => {
				this.usageStats.minuteTokens = 0;
				this.usageStats.lastMinuteCalls = 0;
			}, 60000);
		} catch (error) {
			logger.error('❌ Failed to record token usage:', {
				error: error instanceof Error ? error.message : String(error),
				operation,
				tokens: usage.totalTokenCount,
				userEmail: this.currentUserEmail,
				companyContext: {
					currentCompanyId: this.currentCompanyId,
					currentCompanyName: this.currentCompanyName,
					companiesAvailable: this.companies.length,
					firstCompanyId:
						this.companies.length > 0 ? this.companies[0].companyID : 'none',
				},
				stack: error instanceof Error ? error.stack : undefined,
			});
		}
	}

	/**
	 * Clean up resources and log final statistics
	 */
	async cleanup(): Promise<void> {
		logger.debug('Starting context cleanup...');

		const usageSummary = getUsageSummary(this.modelLimits, this.usageStats);
		logger.info('🔢 Final AI usage statistics:', {
			usage: usageSummary.split('\n'),
		});

		// Clear processing state
		this.jobDetails?.clear();
		this.scrapedData?.clear();
		this.analysisResults?.clear();
		this.cvContent = undefined;
		this.candidateProfile = undefined;
		this.matchedJobs = undefined;

		// Reset company context
		this.currentCompanyId = '';
		this.currentCompanyName = '';

		await logger.saveBufferedLogs();
		logger.debug('Context cleanup completed');
	}
}
