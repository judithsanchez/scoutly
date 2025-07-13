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

export const urls = {
	frontend: 'https://www.jobscoutly.tech',
	backend: 'https://api.jobscoutly.tech',
	local: 'http://localhost:3000',
	localhost127: 'http://127.0.0.1:3000',
	vercelFrontend: 'https://www.jobscoutly.tech',
	vercelBackend: 'https://api.jobscoutly.tech',
};

export const allowedOriginsConfig = {
	dev: [urls.local, urls.localhost127],
	vercel: [
		urls.frontend,
		urls.backend,
		urls.vercelFrontend,
		urls.vercelBackend,
	],
	pi: [urls.frontend, urls.local, urls.vercelFrontend],
	fallback: [urls.local, urls.localhost127],
};

export const auth = {
	nextAuthSecret: process.env.NEXTAUTH_SECRET,
	googleClientId: process.env.GOOGLE_CLIENT_ID,
	googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
};

export const apiBaseUrl = {
	prod: process.env.NEXT_PUBLIC_API_URL,
	dev: urls.local,
	devMongoUri: `mongodb://${process.env.MONGODB_ROOT_USERNAME}:${process.env.MONGODB_ROOT_PASSWORD}@mongodb:27017/${process.env.MONGODB_ROOT_PASSWORD}?authSource=admin`,
	mongoUri: process.env.MONGODB_URI
};

export const secret = {
	internalApiSecret: process.env.INTERNAL_API_SECRET,
	jwt: process.env.JWT_SECRET,

};

// Warn at runtime if INTERNAL_API_SECRET is missing
if (!secret.internalApiSecret) {
	// eslint-disable-next-line no-console
	console.warn('[env] INTERNAL_API_SECRET is missing! This may break internal API authentication.');
}

export const header = {
	INTERNAL_API_SECRET: 'X-Internal-API-Secret',
	AUTHORIZATION: 'Authorization',
	X_FORWARDED_FOR: 'X-Forwarded-For',
	HOST: 'Host',
};
