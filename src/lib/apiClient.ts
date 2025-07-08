'use client';

import {Logger} from '@/utils/logger';

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

	const defaultOptions: RequestInit = {
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
		// --- CRITICAL: Always include credentials for cross-domain auth ---
		credentials: 'include',
		...options,
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
