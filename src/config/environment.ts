/**
 * Centralized environment and flag configuration for Scoutly.
 * Use this object throughout the codebase for consistent, type-safe env access.
 */

// --- Old comprehensive config (for reference/documentation) ---
// export const ENV = {
//   isDev: process.env.NODE_ENV === 'development',
//   isProd: process.env.NODE_ENV === 'production',
//   isTest: process.env.NODE_ENV === 'test',
//   apiUrl: process.env.NEXT_PUBLIC_API_URL,
//   nextAuthUrl: process.env.NEXTAUTH_URL,
//   mongoUri: process.env.MONGODB_URI,
//   internalApiSecret: process.env.INTERNAL_API_SECRET,
//   nextAuthSecret: process.env.NEXTAUTH_SECRET,
//   googleClientId: process.env.GOOGLE_CLIENT_ID,
//   googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
//   bootstrapAdminEmail: process.env.BOOTSTRAP_ADMIN_EMAIL,
//   geminiApiKey: process.env.GEMINI_API_KEY,
//   nextAuthCookieDomain: process.env.NEXTAUTH_COOKIE_DOMAIN,
//   companyScrapeInterval: process.env.NEXT_PUBLIC_COMPANY_SCRAPE_INTERVAL_DAYS,
//   jobStaleAfter: process.env.NEXT_PUBLIC_JOB_STALE_AFTER_DAYS,
//   enableKanban: process.env.NEXT_PUBLIC_ENABLE_KANBAN_VIEW === 'true',
//   enableDataViz: process.env.NEXT_PUBLIC_ENABLE_DATA_VISUALIZATION === 'true',
// };

export enum NodeEnv {
	Development = 'development',
	Production = 'production',
}

export const env = {
	isDev: process.env.NODE_ENV === NodeEnv.Development,
	isProd: process.env.NODE_ENV === NodeEnv.Production,
};

export const deployment = {
	isPi: process.env.DEPLOYMENT === 'pi',
	isVercel: process.env.DEPLOYMENT === 'vercel',
};

export const auth = {
	nextAuthSecret: process.env.NEXTAUTH_SECRET,
	googleClientId: process.env.GOOGLE_CLIENT_ID,
	googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
};

export const apiBaseUrl = {
	prod: process.env.NEXT_PUBLIC_API_URL,
	dev: 'http://localhost:3000',
	devMongoUri: `mongodb://${process.env.MONGODB_ROOT_USERNAME}:${process.env.MONGODB_ROOT_PASSWORD}@mongodb:27017/${process.env.MONGODB_ROOT_PASSWORD}?authSource=admin`,
};

export const secret = {
	internalApiSecret: process.env.INTERNAL_API_SECRET,
};

export const header = {
	internalApiSecret: 'X-Internal-API-Secret',
};
