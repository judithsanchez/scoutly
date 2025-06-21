import {StoryLogEntry, StoryLogger} from '../types';
import {Logger} from '@/utils/logger';

/**
 * Story logger implementation for collecting pipeline narrative logs
 */
export class PipelineStoryLogger implements StoryLogger {
	private logs: StoryLogEntry[] = [];
	private logger: Logger;
	private executionId: string;

	constructor(logger: Logger, executionId: string) {
		this.logger = logger;
		this.executionId = executionId;
	}

	/**
	 * Add an entry to the story log
	 */
	addToStory(
		level: StoryLogEntry['level'],
		stepName: string,
		message: string,
		data?: Record<string, any>,
		metrics?: StoryLogEntry['metrics'],
	): void {
		const entry: StoryLogEntry = {
			timestamp: new Date(),
			level,
			stepName,
			message,
			data,
			metrics,
		};

		this.logs.push(entry);

		// Also log to console for real-time debugging (if needed)
		if (process.env.NODE_ENV === 'development') {
			const logMessage = `[${stepName}] ${message}`;
			switch (level) {
				case 'error':
					console.error(logMessage, data);
					break;
				case 'warn':
					console.warn(logMessage, data);
					break;
				case 'success':
					console.log(`✅ ${logMessage}`, data);
					break;
				case 'debug':
					console.debug(logMessage, data);
					break;
				default:
					console.log(logMessage, data);
			}
		}
	}

	/**
	 * Get the complete story as an array of entries
	 */
	getStory(): StoryLogEntry[] {
		return [...this.logs]; // Return a copy
	}

	/**
	 * Save the complete story to the database as one narrative document
	 */
	async saveStory(): Promise<void> {
		if (this.logs.length === 0) {
			return;
		}

		try {
			// Create a comprehensive story document
			const storyDocument = {
				executionId: this.executionId,
				context: 'Pipeline-Complete-Story',
				startTime: this.logs[0]?.timestamp || new Date(),
				endTime: this.logs[this.logs.length - 1]?.timestamp || new Date(),
				totalSteps: this.logs.length,
				steps: this.getStepSummary(),
				narrative: this.createNarrativeText(),
				logs: this.logs,
				metrics: this.calculateMetrics(),
			};

			// Save using the existing logger infrastructure
			await this.logger.info(
				'Pipeline execution complete story',
				storyDocument,
			);
			await this.logger.saveBufferedLogs();

			console.log(`📚 Pipeline story saved with ${this.logs.length} entries`);
		} catch (error) {
			console.error('Failed to save pipeline story:', error);
			// Don't throw - story logging should not break the pipeline
		}
	}

	/**
	 * Create a human-readable narrative text from the logs
	 */
	private createNarrativeText(): string {
		const lines: string[] = [];

		lines.push('=== PIPELINE EXECUTION STORY ===\\n');

		for (const entry of this.logs) {
			const timestamp = entry.timestamp.toISOString();
			const level = entry.level.toUpperCase().padEnd(7);
			const step = entry.stepName.padEnd(20);

			lines.push(`[${timestamp}] ${level} [${step}] ${entry.message}`);

			if (entry.data) {
				const dataStr = JSON.stringify(entry.data, null, 2);
				lines.push(`    Data: ${dataStr}`);
			}

			if (entry.metrics) {
				const metricsStr = JSON.stringify(entry.metrics, null, 2);
				lines.push(`    Metrics: ${metricsStr}`);
			}

			lines.push(''); // Empty line for readability
		}

		return lines.join('\\n');
	}

	/**
	 * Get a summary of steps executed
	 */
	private getStepSummary(): Record<string, number> {
		const stepCounts: Record<string, number> = {};

		for (const entry of this.logs) {
			stepCounts[entry.stepName] = (stepCounts[entry.stepName] || 0) + 1;
		}

		return stepCounts;
	}

	/**
	 * Calculate overall pipeline metrics
	 */
	private calculateMetrics(): Record<string, any> {
		const startTime = this.logs[0]?.timestamp;
		const endTime = this.logs[this.logs.length - 1]?.timestamp;
		const totalDuration =
			startTime && endTime ? endTime.getTime() - startTime.getTime() : 0;

		let totalTokens = 0;
		let errorCount = 0;
		let successCount = 0;

		for (const entry of this.logs) {
			if (entry.level === 'error') errorCount++;
			if (entry.level === 'success') successCount++;
			if (entry.metrics?.tokens) totalTokens += entry.metrics.tokens;
		}

		return {
			totalDurationMs: totalDuration,
			totalTokensUsed: totalTokens,
			errorCount,
			successCount,
			totalLogEntries: this.logs.length,
		};
	}
}
