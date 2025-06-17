/**
 * Common constant values used throughout the application
 */

// Default user email used for testing and development
// Use NEXT_PUBLIC_ prefix for client-side access in Next.js
export const DEFAULT_USER_EMAIL =
	process.env.NEXT_PUBLIC_DEV_USER_EMAIL || 'dev@scoutly.app';

// Company-related constants
export const COMPANY_RANKING_MIN = 1;
export const COMPANY_RANKING_MAX = 10;
export const DEFAULT_COMPANY_RANKING = 5;

// Application-related constants
export const MAX_SAVED_JOBS = 100;

// Job matching orchestrator constants
export const JOB_MATCHING = {
	MAX_PARALLEL_COMPANIES: 10,
	ERROR_MESSAGES: {
		NO_COMPANIES_PROVIDED: 'No companies provided for batch processing',
		TOO_MANY_COMPANIES: (maxCompanies: number) =>
			`Maximum of ${maxCompanies} companies can be processed in parallel`,
		COMPANIES_ARRAY_EMPTY: 'Companies array cannot be empty',
		INVALID_COMPANY_DATA: 'Invalid company data provided',
	},
	LOG_MESSAGES: {
		BATCH_START: (companyCount: number) =>
			`🚀 Starting batch job matching for ${companyCount} companies`,
		VALIDATION_SUCCESS: 'Batch job matching validation passed',
		PROCESSING_START: 'Beginning parallel processing of companies',
	},
} as const;
