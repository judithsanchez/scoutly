/**
 * CORS and environment config for Scoutly.
 * Uses centralized flags and URLs from src/config/environment.ts.
 * No DB connection logic here!
 */

import {env, deployment, allowedOriginsConfig} from '@/config/environment';

export interface CorsConfig {
	allowedOrigins: string[];
	frontendUrl: string;
	backendUrl: string;
}

export function getCorsConfig(): CorsConfig {
	let allowedOrigins: string[] = [];
	let frontendUrl = '';
	let backendUrl = '';

	if (env.isDev) {
		allowedOrigins = allowedOriginsConfig.dev;
		frontendUrl = allowedOriginsConfig.dev[0];
		backendUrl = allowedOriginsConfig.dev[0];
	} else if (deployment.isVercel) {
		allowedOrigins = allowedOriginsConfig.vercel;
		frontendUrl = allowedOriginsConfig.vercel[0];
		backendUrl = allowedOriginsConfig.vercel[1];
	} else if (deployment.isPi) {
		allowedOrigins = allowedOriginsConfig.pi;
		frontendUrl = allowedOriginsConfig.pi[0];
		backendUrl = allowedOriginsConfig.pi[1];
	} else {
		allowedOrigins = allowedOriginsConfig.fallback;
		frontendUrl = allowedOriginsConfig.fallback[0];
		backendUrl = allowedOriginsConfig.fallback[0];
	}

	// DEBUG: Log allowed origins at runtime
	if (typeof console !== 'undefined') {
		// eslint-disable-next-line no-console
		console.log('[CORS DEBUG] allowedOrigins:', allowedOrigins);
	}

	return {allowedOrigins, frontendUrl, backendUrl};
}

/**
 * Utility to check if an origin is allowed.
 */
export function getAllowedOrigin(
	requestOrigin: string | null,
): string | undefined {
	const {allowedOrigins} = getCorsConfig();
	// DEBUG: Log the request origin and allowed origins
	if (typeof console !== 'undefined') {
		// eslint-disable-next-line no-console
		console.log(
			'[CORS DEBUG] requestOrigin:',
			requestOrigin,
			'allowedOrigins:',
			allowedOrigins,
		);
	}
	if (!requestOrigin) return undefined;
	return allowedOrigins.includes(requestOrigin) ? requestOrigin : undefined;
}
