'use client';

import {Logger} from '@/utils/logger';
import {header} from '@/config/environment';

const logger = new Logger('ApiClient');

const getApiUrl = () => {
	const url = process.env.NEXT_PUBLIC_API_URL;
	if (!url) {
		logger.warn(
			'NEXT_PUBLIC_API_URL is not set. Falling back to relative path.',
		);
		return ''; // Use relative path, do not prepend /api
	}
	return url.endsWith('/') ? url.slice(0, -1) : url;
};

const API_URL = getApiUrl();

/**
 * apiClient - universal API fetcher for Scoutly
 *
 * - If endpoint starts with '/', treat as absolute API route (e.g. '/api/jobs/saved')
 * - If endpoint does NOT start with '/', treat as relative to API_URL (for external API support)
 * - NEVER double-prepend '/api'
 */
async function apiClient<T>(
	endpoint: string,
	options: RequestInit = {},
): Promise<T> {
	// If endpoint starts with '/', do NOT prepend API_URL if API_URL is empty (local dev)
	let url: string;
	if (endpoint.startsWith('/')) {
		url = API_URL ? `${API_URL}${endpoint}` : endpoint;
	} else {
		url = API_URL ? `${API_URL}/${endpoint}` : `/${endpoint}`;
	}

	// Get JWT from localStorage if present (client-side only)
	let jwt: string | null = null;
	if (typeof window !== 'undefined') {
		jwt = localStorage.getItem('jwt');
	}

	// Convert headers to a plain object of string:string
	let mergedHeaders: Record<string, string> = {};
	if (options.headers) {
		// If it's a Headers instance, convert to object
		if (options.headers instanceof Headers) {
			options.headers.forEach((value, key) => {
				mergedHeaders[key] = value;
			});
		} else if (Array.isArray(options.headers)) {
			// If it's an array of tuples
			for (const [key, value] of options.headers) {
				mergedHeaders[key] = value;
			}
		} else {
			// Assume it's already a Record<string, string>
			mergedHeaders = {...(options.headers as Record<string, string>)};
		}
	}
	mergedHeaders['Content-Type'] = 'application/json';

	// Add Authorization header if JWT is present, using config
	if (jwt) {
		mergedHeaders[header.AUTHORIZATION] = `Bearer ${jwt}`;
	}

	// Debug: Log outgoing headers for every request
	logger.debug('apiClient outgoing headers', mergedHeaders);

	// --- CRITICAL: Always include credentials for cross-domain auth ---
	const defaultOptions: RequestInit = {
		...options,
		headers: mergedHeaders,
		credentials: 'include',
	};

	try {
		const response = await fetch(url, defaultOptions);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({
				message: `An error occurred: ${response.statusText}`,
			}));
			logger.error(`API Error on ${endpoint}:`, errorData);
			throw new Error(
				errorData.message || `Request failed with status ${response.status}`,
			);
		}

		// Handle cases with no content
		if (response.status === 204) {
			return null as T;
		}

		return (await response.json()) as T;
	} catch (error) {
		logger.error(`Request failed for endpoint ${endpoint}:`, error);
		throw error;
	}
}

export default apiClient;
