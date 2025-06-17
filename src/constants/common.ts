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
