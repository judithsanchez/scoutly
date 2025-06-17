/**
 * API-related constants
 */

// Default API configuration
export const API_CONFIG = {
	// Base URL for API requests (empty for same-origin requests)
	BASE_URL: '',

	// Default timeout in milliseconds
	DEFAULT_TIMEOUT: 30000,

	// Default headers for all API requests
	DEFAULT_HEADERS: {
		'Content-Type': 'application/json',
		Accept: 'application/json',
	},

	// Query parameter keys
	QUERY_PARAMS: {
		EMAIL: 'gmail',
		PAGE: 'page',
		LIMIT: 'limit',
		SORT: 'sort',
		FILTER: 'filter',
	},
};

// API response status codes
export const API_STATUS = {
	OK: 200,
	CREATED: 201,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	SERVER_ERROR: 500,
};

// Standard error messages
export const API_ERRORS = {
	CONNECTION: 'Connection error. Please check your internet connection.',
	TIMEOUT: 'Request timed out. Please try again.',
	SERVER: 'Server error. Please try again later.',
	NOT_FOUND: 'Resource not found.',
	UNAUTHORIZED: 'Unauthorized. Please log in to continue.',
	FORBIDDEN: 'You do not have permission to access this resource.',
	VALIDATION: 'Validation error. Please check your input.',
};
