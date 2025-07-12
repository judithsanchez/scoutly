/**
 * Common constant values used throughout the application
 */

export const COMPANY_RANKING_MIN = 1;
export const COMPANY_RANKING_MAX = 10;

export const MAX_SAVED_JOBS = 100;

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
