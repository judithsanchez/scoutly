/**
 * Environment detection and configuration
 * Supports dev (localhost), Vercel (frontend), and Raspberry Pi (backend) deployments
 */

export type Environment = 'development' | 'vercel' | 'raspberry-pi';

export interface EnvironmentConfig {
	environment: Environment;
	isProduction: boolean;
	isDevelopment: boolean;
	isVercel: boolean;
	isRaspberryPi: boolean;
	frontendUrl: string;
	backendUrl: string;
	allowedOrigins: string[];
}

/**
 * Detect current environment based on various indicators
 */
export function detectEnvironment(): Environment {
	// Check for Vercel deployment
	if (process.env.VERCEL || process.env.VERCEL_URL) {
		return 'vercel';
	}

	// Check for Raspberry Pi deployment indicators
	if (
		process.env.DEPLOYMENT_TARGET === 'raspberry-pi' ||
		process.env.IS_RASPBERRY_PI === 'true' ||
		(process.env.NODE_ENV === 'production' && !process.env.VERCEL)
	) {
		return 'raspberry-pi';
	}

	// Default to development
	return 'development';
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
	const environment = detectEnvironment();
	const isProduction = process.env.NODE_ENV === 'production';

	const config: EnvironmentConfig = {
		environment,
		isProduction,
		isDevelopment: environment === 'development',
		isVercel: environment === 'vercel',
		isRaspberryPi: environment === 'raspberry-pi',
		frontendUrl: '',
		backendUrl: '',
		allowedOrigins: [],
	};

	// Set URLs based on environment
	switch (environment) {
		case 'development':
			config.frontendUrl =
				process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
			config.backendUrl =
				process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
			config.allowedOrigins = [
				'http://localhost:3000',
				'http://127.0.0.1:3000',
			];
			break;

		case 'vercel':
			config.frontendUrl =
				process.env.NEXT_PUBLIC_FRONTEND_URL ||
				`https://${process.env.VERCEL_URL}`;
			config.backendUrl =
				process.env.NEXT_PUBLIC_BACKEND_URL || 'https://your-pi.example.com';
			config.allowedOrigins = [
				config.frontendUrl,
				process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
				config.backendUrl,
			].filter(Boolean);
			break;

		case 'raspberry-pi':
			config.frontendUrl =
				process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://scoutly.vercel.app';
			config.backendUrl =
				process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
			config.allowedOrigins = [
				config.frontendUrl,
				config.backendUrl,
				'https://scoutly.vercel.app', // Default Vercel domain
			];
			break;
	}

	return config;
}

/**
 * Get the current environment config (singleton)
 */
export const environmentConfig = getEnvironmentConfig();

/**
 * Utility functions for environment checks
 */
export const isServer = typeof window === 'undefined';
export const isClient = typeof window !== 'undefined';
export const isDev = environmentConfig.isDevelopment;
export const isProd = environmentConfig.isProduction;
export const isVercel = environmentConfig.isVercel;
export const isRaspberryPi = environmentConfig.isRaspberryPi;

let MONGODB_URI: string | undefined;

// Explicitly check for the Vercel environment first.
if (environmentConfig.environment === 'vercel') {
	MONGODB_URI = process.env.MONGODB_URI;
} else {
	// All other environments (development, raspberry-pi) use the local URI.
	MONGODB_URI = process.env.MONGODB_URI_LOCAL;
}

if (!MONGODB_URI) {
	if (environmentConfig.isVercel) {
		throw new Error(
			'CRITICAL: MONGODB_URI is not defined in the Vercel environment.',
		);
	} else {
		throw new Error(
			`CRITICAL: MONGODB_URI_LOCAL is not defined for the ${environmentConfig.environment} environment.`,
		);
	}
}

export {MONGODB_URI};
