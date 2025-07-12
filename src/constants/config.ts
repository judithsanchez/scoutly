/**
 * Application configuration constants
 *
 * This file contains configuration settings for the application
 */

export const API_ENDPOINTS = {
	SAVED_JOBS: '/api/jobs/saved',
	SAVED_JOB_STATUS: '/api/jobs/saved/status',
	COMPANIES: '/api/companies',
	COMPANIES_CREATE: '/api/companies/create',
	COMPANIES_UPDATE_RANKINGS: '/api/companies/update-rankings',
	AUTH: '/api/auth',
	PROFILE: '/api/profile',
};

export const ROUTES = {
	HOME: '/',
	DASHBOARD: '/dashboard',
	SAVED_JOBS: '/saved-jobs',
	COMPANIES: '/companies',
	PROFILE: '/profile',
	AUTH: {
		SIGN_IN: '/auth/signin',
		SIGN_UP: '/auth/signup',
		SIGN_OUT: '/auth/signout',
	},
};

export const PAGINATION = {
	DEFAULT_PAGE_SIZE: 10,
	MAX_PAGE_SIZE: 100,
};

export const TIMEOUTS = {
	API_REQUEST: 30000,
	DEBOUNCE_SEARCH: 500,
	SESSION_EXPIRY: 24 * 60 * 60 * 1000,
};

export const FEATURES = {
	ENABLE_ANALYTICS: true,
	ENABLE_NOTIFICATIONS: false,
	EXPERIMENTAL_FEATURES: false,
};
