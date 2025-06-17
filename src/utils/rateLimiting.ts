/**
 * Rate limiting utilities for API usage management
 */

import {Logger} from './logger';
import {IGeminiRateLimit} from '@/config/rateLimits';

const logger = new Logger('RateLimiting');

export interface UsageStats {
	minuteTokens: number;
	dayTokens: number;
	totalTokens: number;
	calls: number;
	lastMinuteCalls: number;
	lastDayCalls: number;
	lastReset: Date;
}

/**
 * Creates initial usage stats object
 *
 * @returns Fresh usage stats object
 */
export function createUsageStats(): UsageStats {
	return {
		minuteTokens: 0,
		dayTokens: 0,
		totalTokens: 0,
		calls: 0,
		lastMinuteCalls: 0,
		lastDayCalls: 0,
		lastReset: new Date(),
	};
}

/**
 * Checks if daily reset is needed and resets counters
 *
 * @param usageStats - Current usage statistics
 * @returns Updated usage stats
 */
export function checkDailyReset(usageStats: UsageStats): UsageStats {
	const now = new Date();
	if (now.getTime() - usageStats.lastReset.getTime() > 86400000) {
		usageStats.dayTokens = 0;
		usageStats.lastDayCalls = 0;
		usageStats.lastReset = now;
	}
	return usageStats;
}

/**
 * Checks rate limits and waits if necessary
 *
 * @param modelLimits - The model's rate limits
 * @param usageStats - Current usage statistics
 */
export async function checkRateLimits(
	modelLimits: IGeminiRateLimit,
	usageStats: UsageStats,
): Promise<void> {
	const {tpm, rpm, rpd} = modelLimits;

	// Check daily limits
	if (rpd && usageStats.lastDayCalls >= rpd) {
		const msUntilTomorrow =
			86400000 - (new Date().getTime() - usageStats.lastReset.getTime());
		logger.warn(
			`Daily request limit (${rpd}) reached, waiting ${Math.ceil(
				msUntilTomorrow / 1000,
			)}s for reset`,
		);
		await new Promise(resolve => setTimeout(resolve, msUntilTomorrow));
		usageStats.lastDayCalls = 0;
	}

	// Check per-minute request limits
	if (rpm && usageStats.lastMinuteCalls >= rpm) {
		logger.warn(
			`Minute request limit (${rpm}) reached, waiting for next minute`,
		);
		await new Promise(resolve => setTimeout(resolve, 60000));
		usageStats.lastMinuteCalls = 0;
	}

	// Check per-minute token limits
	if (tpm && usageStats.minuteTokens >= tpm) {
		logger.warn(`Minute token limit (${tpm}) reached, waiting for next minute`);
		await new Promise(resolve => setTimeout(resolve, 60000));
		usageStats.minuteTokens = 0;
	}
}

/**
 * Generates a usage summary string
 *
 * @param modelLimits - The model's rate limits
 * @param usageStats - Current usage statistics
 * @returns Formatted usage summary
 */
export function getUsageSummary(
	modelLimits: IGeminiRateLimit,
	usageStats: UsageStats,
): string {
	return [
		`Model: ${modelLimits.modelName}`,
		`Last minute: ${usageStats.minuteTokens} tokens${
			modelLimits.tpm ? ` (limit: ${modelLimits.tpm})` : ''
		}`,
		`Today: ${usageStats.dayTokens} tokens${
			modelLimits.tpd ? ` (limit: ${modelLimits.tpd})` : ''
		}`,
		`All time: ${usageStats.totalTokens} tokens across ${usageStats.calls} calls`,
		`Average per call: ${
			Math.round(usageStats.totalTokens / usageStats.calls) || 0
		} tokens`,
	].join('\n');
}

/**
 * Updates usage stats with new token usage
 *
 * @param usageStats - Current usage statistics
 * @param tokenCount - Number of tokens used
 * @returns Updated usage stats
 */
export function updateUsageStats(
	usageStats: UsageStats,
	tokenCount: number,
): UsageStats {
	usageStats.minuteTokens += tokenCount;
	usageStats.dayTokens += tokenCount;
	usageStats.totalTokens += tokenCount;
	usageStats.calls++;
	usageStats.lastMinuteCalls++;
	usageStats.lastDayCalls++;

	return usageStats;
}
