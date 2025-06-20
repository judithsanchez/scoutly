/**
 * Debug Utility for JobMatchingOrchestrator
 *
 * This script checks if the JobMatchingOrchestrator is using the pipeline architecture.
 */

import {EnhancedLogger} from '../utils/enhancedLogger';
import {JobMatchingOrchestrator} from '../services/jobMatchingOrchestrator';

const logger = EnhancedLogger.getLogger('PipelineDebugger', {
	logToFile: true,
	logToConsole: true,
	logDir: '/tmp/scoutly-logs',
	logFileName: 'pipeline-debugger.log',
});

/**
 * Patch the JobMatchingOrchestrator to use pipeline architecture
 */
export function enablePipelineArchitecture() {
	// Access the orchestrator's prototype to modify methods
	const proto = JobMatchingOrchestrator.prototype;

	// Store the original method so we can call it
	const originalProcessBatchCompanies = proto.processBatchCompanies;

	// Replace the processBatchCompanies method with our instrumented version
	proto.processBatchCompanies = function (
		companies,
		cvUrl,
		candidateInfo,
		userEmail,
	) {
		// Force pipeline architecture to be true
		this.usePipeline = true;

		logger.info(
			'🔧 JobMatchingOrchestrator patched to use pipeline architecture',
		);
		logger.info(
			`Pipeline architecture status: ${
				this.usePipeline ? 'ENABLED' : 'DISABLED'
			}`,
		);

		// Call the original method with pipeline forced to true
		return originalProcessBatchCompanies.call(
			this,
			companies,
			cvUrl,
			candidateInfo,
			userEmail,
		);
	};

	logger.success(
		'Pipeline architecture patch applied to JobMatchingOrchestrator',
	);
}

// Export a function to check the current architecture
export function checkPipelineArchitecture(
	orchestrator: JobMatchingOrchestrator,
) {
	const info = orchestrator.getArchitectureInfo();
	logger.info(
		`Current architecture: ${info.version} (Pipeline: ${
			info.usePipeline ? 'ENABLED' : 'DISABLED'
		})`,
	);
	return info.usePipeline;
}
