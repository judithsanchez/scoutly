'use client';

import {Logger} from '@/utils/logger';

const logger = new Logger('ApiClient');

const getApiUrl = () => {
	const url = process.env.NEXT_PUBLIC_API_URL;
	if (!url) {
		// In a server-side context on the Pi, or if something is misconfigured,
		// we might fall back to a local URL.
		// For the Vercel frontend, this should always be set.
		logger.warn(
			'NEXT_PUBLIC_API_URL is not set. Falling back to relative path.',
		);
		return '/api';
	}
	return url;
};

const API_URL = getApiUrl();

async function apiClient<T>(
	endpoint: string,
	options: RequestInit = {},
): Promise<T> {
	const url = `${API_URL}/${
		endpoint.startsWith('/') ? endpoint.substring(1) : endpoint
	}`;

	const defaultOptions: RequestInit = {
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
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
