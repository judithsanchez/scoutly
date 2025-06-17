/**
 * Job Matching Pipeline Engine
 *
 * Executes a series of pipeline steps with shared context and comprehensive error handling
 */

import {Logger} from '@/utils/logger';
import type {
	PipelineStep,
	PipelineContext,
	PipelineOptions,
	PipelineResult,
} from './types';

const logger = new Logger('JobMatchingPipeline');

export class JobMatchingPipeline {
	private steps: PipelineStep[] = [];
	private options: PipelineOptions;

	constructor(options: PipelineOptions = {}) {
		this.options = {
			continueOnError: false,
			allowSkipping: true,
			timeoutMs: 300000, // 5 minutes default
			...options,
		};
	}

	/**
	 * Add a step to the pipeline
	 */
	addStep(step: PipelineStep): this {
		this.steps.push(step);
		logger.debug(`Added step: ${step.name}`);
		return this;
	}

	/**
	 * Add multiple steps to the pipeline
	 */
	addSteps(steps: PipelineStep[]): this {
		steps.forEach(step => this.addStep(step));
		return this;
	}

	/**
	 * Execute the pipeline with the given context
	 */
	async execute(context: PipelineContext): Promise<PipelineResult> {
		const startTime = Date.now();
		const stepResults: PipelineResult['stepResults'] = [];
		let executedSteps = 0;
		let skippedSteps = 0;
		let failedSteps = 0;

		logger.info(
			`🚀 Starting pipeline execution with ${this.steps.length} steps`,
		);

		// Set up timeout if specified
		let timeoutHandle: NodeJS.Timeout | undefined;
		if (this.options.timeoutMs) {
			timeoutHandle = setTimeout(() => {
				throw new Error(
					`Pipeline execution timed out after ${this.options.timeoutMs}ms`,
				);
			}, this.options.timeoutMs);
		}

		try {
			for (let i = 0; i < this.steps.length; i++) {
				const step = this.steps[i];
				const stepStartTime = Date.now();

				logger.info(`📋 Step ${i + 1}/${this.steps.length}: ${step.name}`);

				try {
					// Check if step can be skipped
					if (this.options.allowSkipping && step.canSkip?.(context)) {
						logger.info(`⏭️ Skipping step: ${step.name}`);
						stepResults.push({
							stepName: step.name,
							status: 'skipped',
							executionTimeMs: 0,
						});
						skippedSteps++;
						continue;
					}

					// Validate context before execution
					if (step.validate) {
						step.validate(context);
					}

					// Execute the step
					context = await step.execute(context);

					const executionTime = Date.now() - stepStartTime;
					stepResults.push({
						stepName: step.name,
						status: 'executed',
						executionTimeMs: executionTime,
					});

					executedSteps++;
					logger.info(`✅ Completed step: ${step.name} (${executionTime}ms)`);
				} catch (error) {
					const executionTime = Date.now() - stepStartTime;
					const errorMessage =
						error instanceof Error ? error.message : 'Unknown error';

					logger.error(`❌ Step failed: ${step.name}`, {error: errorMessage});

					stepResults.push({
						stepName: step.name,
						status: 'failed',
						executionTimeMs: executionTime,
						error: error instanceof Error ? error : new Error(String(error)),
					});

					failedSteps++;

					// Handle step error
					if (step.onError) {
						try {
							await step.onError(
								error instanceof Error ? error : new Error(String(error)),
								context,
							);
						} catch (errorHandlerError) {
							logger.error(`Error handler failed for step: ${step.name}`, {
								error: errorHandlerError,
							});
						}
					}

					// Decide whether to continue or abort
					if (!this.options.continueOnError) {
						throw new Error(
							`Pipeline aborted at step: ${step.name}. Error: ${errorMessage}`,
						);
					}
				}
			}

			const totalTime = Date.now() - startTime;

			logger.info(`🏁 Pipeline execution completed`, {
				totalSteps: this.steps.length,
				executed: executedSteps,
				skipped: skippedSteps,
				failed: failedSteps,
				totalTimeMs: totalTime,
			});

			return {
				context,
				summary: {
					totalSteps: this.steps.length,
					executedSteps,
					skippedSteps,
					failedSteps,
					executionTimeMs: totalTime,
				},
				stepResults,
			};
		} finally {
			// Clear timeout
			if (timeoutHandle) {
				clearTimeout(timeoutHandle);
			}
		}
	}

	/**
	 * Get information about the configured steps
	 */
	getStepsInfo(): Array<{name: string; description?: string}> {
		return this.steps.map(step => ({
			name: step.name,
			description: step.description,
		}));
	}

	/**
	 * Clear all steps from the pipeline
	 */
	clear(): this {
		this.steps = [];
		logger.debug('Pipeline steps cleared');
		return this;
	}
}
