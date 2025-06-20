import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkRateLimits, updateUsageStats, createUsageStats, checkDailyReset, getUsageSummary } from '../rateLimiting';
import { GeminiFreeTierLimits } from '@/config/rateLimits';

vi.useFakeTimers();

describe('Rate Limiting Utilities', () => {
	const modelLimits = GeminiFreeTierLimits.findLimitForModel('gemini-2.0-flash-lite')!;

	beforeEach(() => {
		vi.clearAllMocks();
		vi.clearAllTimers();
	});

	describe('createUsageStats', () => {
		it('should create initial usage stats with zero values', () => {
			const stats = createUsageStats();
			
			expect(stats.minuteTokens).toBe(0);
			expect(stats.dayTokens).toBe(0);
			expect(stats.totalTokens).toBe(0);
			expect(stats.calls).toBe(0);
			expect(stats.lastMinuteCalls).toBe(0);
			expect(stats.lastDayCalls).toBe(0);
			expect(stats.lastReset).toBeInstanceOf(Date);
		});
	});

	describe('checkRateLimits', () => {
		it('should not wait if limits are not reached', async () => {
			const usageStats = createUsageStats();
			const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
			
			await checkRateLimits(modelLimits, usageStats);
			
			expect(setTimeoutSpy).not.toHaveBeenCalled();
		});

		it('should wait if RPM limit is reached', async () => {
			const usageStats = createUsageStats();
			usageStats.lastMinuteCalls = modelLimits.rpm!; // Exceed the limit
			
			const promise = checkRateLimits(modelLimits, usageStats);
			
			// Verify setTimeout was called with 60000ms (1 minute)
			expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 60000);
			
			// Fast-forward time to resolve the promise
			vi.runAllTimers();
			await promise;
			
			// Verify the counter was reset
			expect(usageStats.lastMinuteCalls).toBe(0);
		});

		it('should wait if TPM limit is reached', async () => {
			const usageStats = createUsageStats();
			usageStats.minuteTokens = modelLimits.tpm!; // Exceed the limit
			
			const promise = checkRateLimits(modelLimits, usageStats);
			
			// Verify setTimeout was called with 60000ms (1 minute)
			expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 60000);
			
			// Fast-forward time to resolve the promise
			vi.runAllTimers();
			await promise;
			
			// Verify the counter was reset
			expect(usageStats.minuteTokens).toBe(0);
		});

		it('should wait if daily request limit is reached', async () => {
			const usageStats = createUsageStats();
			usageStats.lastDayCalls = modelLimits.rpd!; // Exceed the limit
			usageStats.lastReset = new Date(Date.now() - 3600000); // 1 hour ago
			
			const promise = checkRateLimits(modelLimits, usageStats);
			
			// Should wait for the remaining time until tomorrow (23 hours)
			const expectedWaitTime = 86400000 - 3600000; // 23 hours in ms
			expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), expectedWaitTime);
			
			// Fast-forward time to resolve the promise
			vi.runAllTimers();
			await promise;
			
			// Verify the counter was reset
			expect(usageStats.lastDayCalls).toBe(0);
		});
	});

	describe('updateUsageStats', () => {
		it('should correctly increment token and call counts', () => {
			let usageStats = createUsageStats();
			usageStats = updateUsageStats(usageStats, 1000);

			expect(usageStats.totalTokens).toBe(1000);
			expect(usageStats.minuteTokens).toBe(1000);
			expect(usageStats.dayTokens).toBe(1000);
			expect(usageStats.calls).toBe(1);
			expect(usageStats.lastMinuteCalls).toBe(1);
			expect(usageStats.lastDayCalls).toBe(1);
		});

		it('should accumulate multiple usage updates', () => {
			let usageStats = createUsageStats();
			usageStats = updateUsageStats(usageStats, 500);
			usageStats = updateUsageStats(usageStats, 300);

			expect(usageStats.totalTokens).toBe(800);
			expect(usageStats.minuteTokens).toBe(800);
			expect(usageStats.dayTokens).toBe(800);
			expect(usageStats.calls).toBe(2);
			expect(usageStats.lastMinuteCalls).toBe(2);
			expect(usageStats.lastDayCalls).toBe(2);
		});
	});

	describe('checkDailyReset', () => {
		it('should not reset counters within 24 hours', () => {
			let usageStats = createUsageStats();
			usageStats.dayTokens = 5000;
			usageStats.lastDayCalls = 10;
			usageStats.lastReset = new Date(Date.now() - 3600000); // 1 hour ago

			usageStats = checkDailyReset(usageStats);
			
			expect(usageStats.dayTokens).toBe(5000);
			expect(usageStats.lastDayCalls).toBe(10);
		});

		it('should reset counters after 24 hours', () => {
			let usageStats = createUsageStats();
			usageStats.dayTokens = 5000;
			usageStats.lastDayCalls = 10;
			usageStats.lastReset = new Date(Date.now() - 86400001); // Just over 24 hours ago

			const originalReset = usageStats.lastReset;
			usageStats = checkDailyReset(usageStats);
			
			expect(usageStats.dayTokens).toBe(0);
			expect(usageStats.lastDayCalls).toBe(0);
			expect(usageStats.lastReset.getTime()).toBeGreaterThan(originalReset.getTime());
		});
	});

	describe('getUsageSummary', () => {
		it('should generate correct usage summary', () => {
			const usageStats = createUsageStats();
			usageStats.minuteTokens = 500;
			usageStats.dayTokens = 5000;
			usageStats.totalTokens = 50000;
			usageStats.calls = 10;

			const summary = getUsageSummary(modelLimits, usageStats);
			
			expect(summary).toContain('Model: gemini-2.0-flash-lite');
			expect(summary).toContain('Last minute: 500 tokens');
			expect(summary).toContain('Today: 5000 tokens');
			expect(summary).toContain('All time: 50000 tokens across 10 calls');
			expect(summary).toContain('Average per call: 5000 tokens');
		});

		it('should handle zero calls without division error', () => {
			const usageStats = createUsageStats();

			const summary = getUsageSummary(modelLimits, usageStats);
			
			expect(summary).toContain('Average per call: 0 tokens');
		});
	});
});
