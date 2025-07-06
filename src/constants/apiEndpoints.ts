/**
 * API ENDPOINTS REFERENCE - Scoutly Application
 *
 * ⚠️  CRITICAL ARCHITECTURE RULE ⚠️
 *
 * ALL CLIENT-SIDE DATA ACCESS MUST GO THROUGH API ENDPOINTS
 *
 * This project follows a strict API-only data access pattern:
 * - Client components (React/Next.js) are FORBIDDEN from calling the database directly
 * - All database operations MUST go through Next.js API routes (/api/*)
 * - API routes handle authentication, validation, and database operations
 * - This ensures proper separation of concerns and security
 *
 * HOW WE HANDLE API CALLS:
 *
 * 1. Frontend components use custom hooks (e.g., useCompanies, useUsers)
 * 2. Custom hooks use @tanstack/react-query for caching and state management
 * 3. API calls are made through our apiClient utility (src/lib/apiClient.ts)
 * 4. API routes handle all database operations using services and models
 *
 * EXAMPLES:
 *
 * ❌ WRONG - Direct database call from client:
 * ```typescript
 * // NEVER DO THIS IN CLIENT COMPONENTS
 * import { User } from '@/models/User';
 * const user = await User.findOne({ email });
 * ```
 *
 * ✅ CORRECT - API call from client:
 * ```typescript
 * // In a custom hook (src/hooks/useUsers.ts)
 * const { data: user } = useQuery({
 *   queryKey: ['user', email],
 *   queryFn: () => fetch('/api/users/query', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ email })
 *   }).then(res => res.json())
 * });
 * ```
 *
 * ✅ CORRECT - Using our apiClient utility:
 * ```typescript
 * // In a component or hook
 * import { apiClient } from '@/lib/apiClient';
 *
 * const trackCompany = async (email: string, companyId: string) => {
 *   return apiClient.post('/api/user-company-preferences', {
 *     email,
 *     companyId,
 *     isTracking: true,
 *     rank: 75
 *   });
 * };
 * ```
 *
 * ENDPOINT ORGANIZATION:
 * Complete list of all API endpoints in the Scoutly application
 * Organized by category for easy reference
 */
export const API_ENDPOINTS = {
	// Admin endpoints
	ADMIN: {
		DASHBOARD: '/api/admin/dashboard',
		PROMOTE_USER: '/api/admin/promote',
		SEED_COMPANIES: '/api/admin/seed-companies',
		USERS: '/api/admin/users',
	},

	// Authentication endpoints
	AUTH: {
		NEXTAUTH: '/api/auth/[...nextauth]',
		SESSION: '/api/internal/auth/session',
		SIGNIN: '/api/internal/auth/signin',
	},

	// Company endpoints
	COMPANIES: {
		LIST: '/api/companies',
		CREATE: '/api/companies/create',
		UPDATE_RANKINGS: '/api/companies/update-rankings',
	},

	// Debug endpoints
	DEBUG: {
		MAIN: '/api/debug',
		AUTH: '/api/debug/auth',
	},

	// Health check
	HEALTH: '/api/health',

	// Job endpoints
	JOBS: {
		SEARCH: '/api/jobs',
		CHECK_STALE: '/api/jobs/check-stale',
		SAVED: '/api/jobs/saved',
		SAVED_STATUS: '/api/jobs/saved/status',
	},

	// Scraping endpoints
	SCRAPE: '/api/scrape',

	// User Company Preferences endpoints
	USER_COMPANY_PREFERENCES: {
		LIST: '/api/user-company-preferences',
		BY_COMPANY_ID: '/api/user-company-preferences/[companyId]',
	},

	// User endpoints
	USERS: {
		MAIN: '/api/users',
		CHECK_AUTH: '/api/users/check-auth',
		PROFILE: '/api/users/profile',
		QUERY: '/api/users/query',
	},
} as const;

/**
 * Flattened list of all endpoints for easy iteration
 */
export const ALL_ENDPOINTS = [
	// Admin
	'/api/admin/dashboard',
	'/api/admin/promote',
	'/api/admin/seed-companies',
	'/api/admin/users',

	// Auth
	'/api/auth/[...nextauth]',
	'/api/internal/auth/session',
	'/api/internal/auth/signin',

	// Companies
	'/api/companies',
	'/api/companies/create',
	'/api/companies/update-rankings',

	// Debug
	'/api/debug',
	'/api/debug/auth',

	// Health
	'/api/health',

	// Jobs
	'/api/jobs',
	'/api/jobs/check-stale',
	'/api/jobs/saved',
	'/api/jobs/saved/status',

	// Scrape
	'/api/scrape',

	// User Company Preferences
	'/api/user-company-preferences',
	'/api/user-company-preferences/[companyId]',

	// Users
	'/api/users',
	'/api/users/check-auth',
	'/api/users/profile',
	'/api/users/query',
] as const;

/**
 * HTTP methods supported by each endpoint
 */
export const ENDPOINT_METHODS = {
	'/api/admin/dashboard': ['GET'],
	'/api/admin/promote': ['POST'],
	'/api/admin/seed-companies': ['POST'],
	'/api/admin/users': ['GET'],
	'/api/auth/[...nextauth]': ['GET', 'POST'],
	'/api/internal/auth/session': ['GET'],
	'/api/internal/auth/signin': ['POST'],
	'/api/companies': ['GET'],
	'/api/companies/create': ['POST'],
	'/api/companies/update-rankings': ['POST'],
	'/api/debug': ['GET'],
	'/api/debug/auth': ['GET'],
	'/api/health': ['GET'],
	'/api/jobs': ['POST'],
	'/api/jobs/check-stale': ['POST'],
	'/api/jobs/saved': ['GET', 'POST'],
	'/api/jobs/saved/status': ['PUT'],
	'/api/scrape': ['POST'],
	'/api/user-company-preferences': ['GET', 'POST'],
	'/api/user-company-preferences/[companyId]': ['GET', 'PUT', 'DELETE'],
	'/api/users': ['POST'],
	'/api/users/check-auth': ['GET'],
	'/api/users/profile': ['GET'],
	'/api/users/query': ['POST'],
} as const;

/**
 * Type-safe endpoint paths
 */
export type EndpointPath = (typeof ALL_ENDPOINTS)[number];
export type AdminEndpoint =
	(typeof API_ENDPOINTS.ADMIN)[keyof typeof API_ENDPOINTS.ADMIN];
export type AuthEndpoint =
	(typeof API_ENDPOINTS.AUTH)[keyof typeof API_ENDPOINTS.AUTH];
export type CompanyEndpoint =
	(typeof API_ENDPOINTS.COMPANIES)[keyof typeof API_ENDPOINTS.COMPANIES];
export type JobEndpoint =
	(typeof API_ENDPOINTS.JOBS)[keyof typeof API_ENDPOINTS.JOBS];
export type UserEndpoint =
	(typeof API_ENDPOINTS.USERS)[keyof typeof API_ENDPOINTS.USERS];
