/**
 * CV Processing Pipeline Step
 *
 * Downloads and extracts text content from the candidate's CV
 */

import {Logger} from '@/utils/logger';
import {getCvContentAsText} from '@/utils/cvProcessor';
import type {PipelineStep, PipelineContext} from '../types';

const logger = new Logger('CvProcessingStep');

export class CvProcessingStep implements PipelineStep {
	readonly name = 'CvProcessing';
	readonly description = 'Downloads and extracts text content from CV';

	/**
	 * Process the CV and extract text content
	 */
	async execute(context: PipelineContext): Promise<PipelineContext> {
		logger.info(`Processing CV from URL: ${context.cvUrl}`);

		try {
			// Extract CV content using existing utility
			context.cvContent = await getCvContentAsText(context.cvUrl);

			logger.info(
				`✓ CV processed. Extracted ${context.cvContent.length} characters.`,
			);

			return context;
		} catch (error) {
			logger.error('Failed to process CV:', error);
			throw new Error(
				`CV processing failed: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`,
			);
		}
	}

	/**
	 * Skip if CV content is already available
	 */
	canSkip(context: PipelineContext): boolean {
		return !!(context.cvContent && context.cvContent.length > 0);
	}

	/**
	 * Validate that CV URL is provided
	 */
	validate(context: PipelineContext): void {
		if (!context.cvUrl || typeof context.cvUrl !== 'string') {
			throw new Error('CV URL is required for CV processing');
		}

		if (!context.cvUrl.trim()) {
			throw new Error('CV URL cannot be empty');
		}
	}

	/**
	 * Handle CV processing errors
	 */
	async onError(error: Error, context: PipelineContext): Promise<void> {
		logger.error('CV processing step failed:', {
			error: error.message,
			cvUrl: context.cvUrl,
			userEmail: context.userEmail,
		});

		// Could implement fallback logic here, such as:
		// - Retry with different extraction method
		// - Use cached CV content if available
		// - Request manual CV upload
	}
}
