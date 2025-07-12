/**
 * API-related constants
 */

export const API_CONFIG = {
	BASE_URL: '',

	DEFAULT_TIMEOUT: 30000,

	DEFAULT_HEADERS: {
		'Content-Type': 'application/json',
		Accept: 'application/json',
	},

	QUERY_PARAMS: {
		EMAIL: 'gmail',
		PAGE: 'page',
		LIMIT: 'limit',
		SORT: 'sort',
		FILTER: 'filter',
	},
};

export const API_STATUS = {
	OK: 200,
	CREATED: 201,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	SERVER_ERROR: 500,
};

export const API_ERRORS = {
	CONNECTION: 'Connection error. Please check your internet connection.',
	TIMEOUT: 'Request timed out. Please try again.',
	SERVER: 'Server error. Please try again later.',
	NOT_FOUND: 'Resource not found.',
	UNAUTHORIZED: 'Unauthorized. Please log in to continue.',
	FORBIDDEN: 'You do not have permission to access this resource.',
	VALIDATION: 'Validation error. Please check your input.',
};
