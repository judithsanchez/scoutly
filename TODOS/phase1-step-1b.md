Phase 1, Step 1.2: TDD Implementation of Live Rate Limiting (Pipeline Focus)
Goal: To build a proactive rate-limiting and token-tracking system for the **pipeline architecture only**. This system will manage usage in real-time to respect API limits (RPM, TPM, RPD) and persist detailed usage data to the database for analytics.

**Architecture Focus**: This implementation will focus exclusively on the pipeline architecture, as the legacy JobMatchingOrchestrator will be removed in favor of the more robust pipeline system.

Part 1: The Core Rate-Limiting Logic (TDD)
We'll start by building the utility functions that will form the brain of our rate-limiter.

A. Write the Utility Tests (Test First)
Action: Create a new test file: src/utils/**tests**/rateLimiting.test.ts

Goal: Define the expected behavior of the rate-limiting logic.

// src/utils/**tests**/rateLimiting.test.ts
import { describe, it, expect, vi } from 'vitest';
import { checkRateLimits, updateUsageStats, createUsageStats, checkDailyReset } from '../rateLimiting';
import { GeminiFreeTierLimits } from '@/config/rateLimits';

vi.useFakeTimers();

describe('Rate Limiting Utilities', () => {
const modelLimits = GeminiFreeTierLimits.findLimitForModel('gemini-2.0-flash-lite')!;

it('checkRateLimits should not wait if limits are not reached', async () => {
const usageStats = createUsageStats();
const waitSpy = vi.spyOn(global, 'setTimeout');
await checkRateLimits(modelLimits, usageStats);
expect(waitSpy).not.toHaveBeenCalled();
});

it('checkRateLimits should wait if RPM limit is reached', async () => {
const usageStats = createUsageStats();
usageStats.lastMinuteCalls = modelLimits.rpm!; // Exceed the limit
const waitSpy = vi.spyOn(global, 'setTimeout');

    const promise = checkRateLimits(modelLimits, usageStats);
    vi.runAllTimers(); // Fast-forward time
    await promise;

    expect(waitSpy).toHaveBeenCalledWith(expect.any(Function), 60000);

});

it('updateUsageStats should correctly increment token and call counts', () => {
let usageStats = createUsageStats();
usageStats = updateUsageStats(usageStats, 1000);

    expect(usageStats.totalTokens).toBe(1000);
    expect(usageStats.minuteTokens).toBe(1000);
    expect(usageStats.calls).toBe(1);

});

it('checkDailyReset should reset counters after 24 hours', () => {
let usageStats = createUsageStats();
usageStats.dayTokens = 5000;
usageStats.lastReset = new Date(Date.now() - 86400001); // Set to just over 24 hours ago

    usageStats = checkDailyReset(usageStats);
    expect(usageStats.dayTokens).toBe(0);

});
});

B. Implement the Utility Functions
Action: Create/modify the file src/utils/rateLimiting.ts.

Goal: Write the implementation to make the tests above pass.

// src/utils/rateLimiting.ts
import { Logger } from './logger';
import { type IGeminiRateLimit } from '@/config/rateLimits';

const logger = new Logger('RateLimiting');

export interface UsageStats {
// ... (minuteTokens, dayTokens, etc.)
}

export function createUsageStats(): UsageStats { /_ ... _/ }

export function checkDailyReset(usageStats: UsageStats): UsageStats { /_ ... _/ }

export function updateUsageStats(usageStats: UsageStats, tokenCount: number): UsageStats { /_ ... _/ }

export async function checkRateLimits(modelLimits: IGeminiRateLimit, usageStats: UsageStats): Promise<void> {
const { rpm, tpm, rpd } = modelLimits;

// Check daily request limit
if (rpd && usageStats.lastDayCalls >= rpd) {
const msUntilTomorrow = 86400000 - (new Date().getTime() - usageStats.lastReset.getTime());
logger.warn(`Daily request limit (${rpd}) reached, waiting ${Math.ceil(msUntilTomorrow / 1000)}s.`);
await new Promise(resolve => setTimeout(resolve, msUntilTomorrow));
usageStats.lastDayCalls = 0;
}

// Check per-minute request limit
if (rpm && usageStats.lastMinuteCalls >= rpm) {
logger.warn(`RPM limit (${rpm}) reached, waiting for 60s.`);
await new Promise(resolve => setTimeout(resolve, 60000));
usageStats.lastMinuteCalls = 0;
}

// Check per-minute token limit
if (tpm && usageStats.minuteTokens >= tpm) {
logger.warn(`TPM limit (${tpm}) reached, waiting for 60s.`);
await new Promise(resolve => setTimeout(resolve, 60000));
usageStats.minuteTokens = 0;
}
}

Part 2: Integrating Live Checks into the AI Processor
Now, we'll use these utilities to proactively manage API calls.

A. Refactor the aiProcessor
File: src/utils/aiProcessor.ts

Action: Modify the AI processing functions to perform a rate-limit check before making the API call. Also, change them to return the token usage data instead of recording it themselves.

// src/utils/aiProcessor.ts
import { checkRateLimits } from './rateLimiting';
// ... other imports

// Modify analyzeJobBatch (and performInitialMatching similarly)
export async function analyzeJobBatch(
// ... parameters
config: AIProcessorConfig,
): Promise<AnalysisResultWithUsage> {
// ... (prompt creation logic)

// 1. Perform rate limit check BEFORE the API call
await checkRateLimits(config.modelLimits, config.usageStats);

// 2. Make the API call
const result = await config.model.generateContent({ /_ ... _/ });

// 3. Extract and return token usage data for the caller to handle
const tokenUsage = {
promptTokenCount: result.response.usageMetadata?.promptTokenCount || 0,
candidatesTokenCount: result.response.usageMetadata?.candidatesTokenCount || 0,
totalTokenCount: result.response.usageMetadata?.totalTokenCount || 0,
};

const analysis = JSON.parse(result.response.text());

return {
results: analysis.analysisResults || [],
tokenUsage, // Return usage data
};
}

B. Refactor the Pipeline Context and Steps
File: src/services/pipeline/JobMatchingContext.ts

Action: Implement the recordUsage method. This method will be responsible for both updating the live, in-memory usageStats and persisting the final record to the database via the TokenUsageService.

// src/services/pipeline/JobMatchingContext.ts
import { updateUsageStats } from '@/utils/rateLimiting';
import { TokenUsageService } from '../tokenUsageService';

export class JobMatchingContext implements PipelineContext {
// ...
async recordUsage(usage: TokenUsage, operation: TokenOperation): Promise<void> {
// 1. Update the live, in-memory stats for the next rate-limit check
this.usageStats = updateUsageStats(this.usageStats, usage.totalTokenCount);

    // 2. Persist the record to the database for long-term analytics
    await TokenUsageService.recordUsage({
      // ... (build the full payload with costs, company info, etc.)
    });

}
// ...
}

File: src/services/pipeline/steps/DeepAnalysisStep.ts (and other AI-related steps)

Action: Update the execute method to call the new context method.

// src/services/pipeline/steps/DeepAnalysisStep.ts
export class DeepAnalysisStep implements PipelineStep {
async execute(context: PipelineContext): Promise<PipelineContext> {
// ...
const batchResult = await analyzeJobBatch(/_ ... _/);

    // The step now tells the context to record the usage
    await context.recordUsage(batchResult.tokenUsage, TokenOperation.DEEP_DIVE_ANALYSIS);
    // ...

}
}

End State for Step 1.2
After completing this phase:

Your system will have a proactive checkRateLimits function that pauses execution to avoid hitting API limits.

The aiProcessor will enforce these limits before every single API call.

The JobMatchingContext will manage the live UsageStats object, ensuring accurate checks throughout a multi-step pipeline run.

The TokenUsageService will be responsible solely for persisting the final token counts for each operation to the database.

This separation of concerns makes the entire system more robust, testable, and reliable.
