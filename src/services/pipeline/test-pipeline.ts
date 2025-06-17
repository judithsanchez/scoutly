/**
 * Simple Pipeline Integration Test
 *
 * Tests the basic pipeline functionality with the first few steps
 */

import {JobMatchingPipeline} from './JobMatchingPipeline';
import {JobMatchingContext} from './JobMatchingContext';
import {CandidateProfileStep} from './steps/CandidateProfileStep';
import {createUsageStats} from '@/utils/rateLimiting';
import {GeminiFreeTierLimits} from '@/config/rateLimits';

/**
 * Simple test to verify pipeline infrastructure works
 */
async function testPipelineBasics() {
	console.log('🧪 Testing Pipeline Infrastructure...');

	try {
		const candidateInfo = {
			name: 'Test Candidate',
			email: 'test@example.com',
		};

		// Create pipeline
		const pipeline = new JobMatchingPipeline({
			continueOnError: true,
			allowSkipping: true,
			timeoutMs: 30000,
		});

		// Add simple test step
		pipeline.addStep(new CandidateProfileStep());

		// Create minimal context for testing
		const usageStats = createUsageStats();
		const modelLimits = GeminiFreeTierLimits.findLimitForModel(
			'gemini-2.0-flash-lite',
		)!;

		// Create a minimal context just for testing
		const context = new JobMatchingContext(
			[] as any, // empty companies for now
			'test-cv-url',
			candidateInfo,
			'test@example.com',
			usageStats,
			{} as any, // minimal aiConfig for now
			modelLimits,
		);

		// Execute pipeline
		const result = await pipeline.execute(context);

		console.log('✅ Pipeline execution result:', {
			totalSteps: result.summary.totalSteps,
			executed: result.summary.executedSteps,
			skipped: result.summary.skippedSteps,
			failed: result.summary.failedSteps,
			time: `${result.summary.executionTimeMs}ms`,
		});

		return true;
	} catch (error) {
		console.error('❌ Pipeline test failed:', error);
		return false;
	}
}

export {testPipelineBasics};
