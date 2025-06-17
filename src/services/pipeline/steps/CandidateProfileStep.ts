/**
 * Candidate Profile Processing Pipeline Step
 *
 * Processes and validates candidate information
 */

import {Logger} from '@/utils/logger';
import type {PipelineStep, PipelineContext} from '../types';

const logger = new Logger('CandidateProfileStep');

export class CandidateProfileStep implements PipelineStep {
	readonly name = 'CandidateProfile';
	readonly description = 'Processes and validates candidate information';

	/**
	 * Process candidate profile information
	 */
	async execute(context: PipelineContext): Promise<PipelineContext> {
		logger.info('Processing candidate profile information');

		try {
			// Process and validate candidate info
			context.candidateProfile = this.processProfile(context.candidateInfo);

			logger.info('✓ Candidate profile processed successfully');

			return context;
		} catch (error) {
			logger.error('Failed to process candidate profile:', error);
			throw new Error(
				`Candidate profile processing failed: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`,
			);
		}
	}

	/**
	 * Skip if candidate profile is already processed
	 */
	canSkip(context: PipelineContext): boolean {
		return !!(
			context.candidateProfile &&
			Object.keys(context.candidateProfile).length > 0
		);
	}

	/**
	 * Validate that candidate info is provided
	 */
	validate(context: PipelineContext): void {
		if (!context.candidateInfo || typeof context.candidateInfo !== 'object') {
			throw new Error('Candidate information is required');
		}

		if (Object.keys(context.candidateInfo).length === 0) {
			throw new Error('Candidate information cannot be empty');
		}
	}

	/**
	 * Process the raw candidate information
	 */
	private processProfile(
		candidateInfo: Record<string, any>,
	): Record<string, any> {
		// For now, we'll use the candidate info as-is
		// In the future, this could include:
		// - Data validation and sanitization
		// - Profile enrichment
		// - Skill extraction and categorization
		// - Experience level calculation

		const processed = {...candidateInfo};

		// Add any default processing logic here
		if (!processed.processedAt) {
			processed.processedAt = new Date().toISOString();
		}

		return processed;
	}

	/**
	 * Handle candidate profile processing errors
	 */
	async onError(error: Error, context: PipelineContext): Promise<void> {
		logger.error('Candidate profile processing step failed:', {
			error: error.message,
			userEmail: context.userEmail,
			candidateInfoKeys: Object.keys(context.candidateInfo || {}),
		});

		// Could implement fallback logic here, such as:
		// - Use minimal profile with just basic info
		// - Request additional profile information
		// - Apply default values for missing fields
	}
}
