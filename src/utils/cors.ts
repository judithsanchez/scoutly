import { NextResponse } from 'next/server';

/**
 * Returns a NextResponse for CORS preflight OPTIONS requests with standard headers and debug info.
 * @param routeName - A string to identify the route for debugging (e.g. 'users/update-password')
 */
export function corsOptionsResponse(routeName: string) {
  return NextResponse.json({}, {
	status: 200,
	headers: {
	  'Access-Control-Allow-Origin': 'https://www.jobscoutly.tech',
	  'Access-Control-Allow-Methods': 'GET,DELETE,PATCH,POST,PUT,OPTIONS',
	  'Access-Control-Allow-Headers': 'Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, Authorization, X-Internal-API-Secret',
	  'Access-Control-Allow-Credentials': 'true',
	  'X-CORS-Debug': `OPTIONS handler hit for ${routeName}`,
	},
  });
}

/**
 * Adds CORS headers to an existing NextResponse (for runtime responses).
 * @param response - The NextResponse to modify
 * @param routeName - A string to identify the route for debugging
 */
export function addCorsHeaders(response: NextResponse, routeName: string) {
  response.headers.set('Access-Control-Allow-Origin', 'https://www.jobscoutly.tech');
  response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, Authorization, X-Internal-API-Secret');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('X-CORS-Debug', `addCorsHeaders for ${routeName}`);
  return response;
}
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
