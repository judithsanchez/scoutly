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

export function checkDailyReset(usageStats: UsageStats): UsageStats {
	const now = new Date();
	if (now.getTime() - usageStats.lastReset.getTime() > 86400000) {
		usageStats.dayTokens = 0;
		usageStats.lastDayCalls = 0;
		usageStats.lastReset = now;
	}
	return usageStats;
}

export async function checkRateLimits(
	modelLimits: IGeminiRateLimit,
	usageStats: UsageStats,
): Promise<void> {
	const {tpm, rpm, rpd} = modelLimits;

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

	if (rpm && usageStats.lastMinuteCalls >= rpm) {
		logger.warn(
			`Minute request limit (${rpm}) reached, waiting for next minute`,
		);
		await new Promise(resolve => setTimeout(resolve, 60000));
		usageStats.lastMinuteCalls = 0;
	}

	if (tpm && usageStats.minuteTokens >= tpm) {
		logger.warn(`Minute token limit (${tpm}) reached, waiting for next minute`);
		await new Promise(resolve => setTimeout(resolve, 60000));
		usageStats.minuteTokens = 0;
	}
}

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
