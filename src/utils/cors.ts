// Utility to get allowed origins from environment config
import {environmentConfig} from '@/config/environment';

export function getAllowedOrigin(
	requestOrigin: string | null,
): string | undefined {
	if (!requestOrigin) return undefined;
	// If in development, allow localhost only
	if (process.env.NODE_ENV === 'development') {
		return environmentConfig.allowedOrigins.includes(requestOrigin)
			? requestOrigin
			: undefined;
	}
	// In production, allow only exact matches from allowedOrigins
	return environmentConfig.allowedOrigins.includes(requestOrigin)
		? requestOrigin
		: undefined;
}
