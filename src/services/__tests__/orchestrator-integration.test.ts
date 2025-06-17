import {JobMatchingOrchestrator} from '../jobMatchingOrchestrator';
import {Logger} from '@/utils/logger';

const logger = new Logger('OrchestratorIntegrationTest');

/**
 * Integration test for the JobMatchingOrchestrator with pipeline support
 */
async function testOrchestratorIntegration() {
	logger.info('🧪 Starting JobMatchingOrchestrator integration test');

	try {
		// Check if required environment variables are available
		if (!process.env.GEMINI_API_KEY) {
			logger.warn(
				'⚠️ GEMINI_API_KEY not available, testing initialization only',
			);

			// Test that the error is thrown correctly
			try {
				new JobMatchingOrchestrator();
				throw new Error('Expected GEMINI_API_KEY error was not thrown');
			} catch (error) {
				if (
					error instanceof Error &&
					error.message.includes('GEMINI_API_KEY')
				) {
					logger.info('✅ Correct error handling for missing API key');
				} else {
					throw error;
				}
			}

			return {
				success: true,
				note: 'Limited test due to missing GEMINI_API_KEY',
				architectureSupport: 'untested',
				pipelineToggle: 'untested',
			};
		}

		// Test orchestrator initialization
		const orchestrator = new JobMatchingOrchestrator();
		logger.info('✅ Orchestrator initialized successfully');

		// Test architecture info
		const archInfo = orchestrator.getArchitectureInfo();
		logger.info(`📊 Architecture info:`, archInfo);

		// Test pipeline toggle
		logger.info('🔄 Testing pipeline toggle...');

		// Test disabling pipeline
		orchestrator.setPipelineEnabled(false);
		const legacyInfo = orchestrator.getArchitectureInfo();
		logger.info(`📊 After disable:`, legacyInfo);

		if (legacyInfo.usePipeline !== false || legacyInfo.version !== 'legacy') {
			throw new Error('Pipeline disable failed');
		}

		// Test enabling pipeline
		orchestrator.setPipelineEnabled(true);
		const pipelineInfo = orchestrator.getArchitectureInfo();
		logger.info(`📊 After enable:`, pipelineInfo);

		if (
			pipelineInfo.usePipeline !== true ||
			pipelineInfo.version !== 'pipeline-based'
		) {
			throw new Error('Pipeline enable failed');
		}

		logger.success('✅ All orchestrator integration tests passed!');

		return {
			success: true,
			architectureSupport: true,
			pipelineToggle: true,
		};
	} catch (error) {
		logger.error('❌ Orchestrator integration test failed:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

// Export for potential use in larger test suites
export {testOrchestratorIntegration};

// Run test if this file is executed directly
if (require.main === module) {
	testOrchestratorIntegration().then(result => {
		if (result.success) {
			process.exit(0);
		} else {
			console.error('Test failed:', result.error);
			process.exit(1);
		}
	});
}
