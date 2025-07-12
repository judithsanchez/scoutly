export const endpoint = {
	admin: {
		dashboard: '/api/admin/dashboard',
		promote_user: '/api/admin/promote',
		seed_companies: '/api/admin/seed-companies',
		users: '/api/admin/users',
	},

	auth: {
		register: '/api/auth/register',
		login: '/api/auth/login',
	},

	companies: {
		list: '/api/companies',
		create: '/api/companies/create',
		update_rankings: '/api/companies/update-rankings',
		byId: '/api/companies/:companyId',
	},

	jobs: {
		search: '/api/jobs',
		check_stale: '/api/jobs/check-stale',
		saved: '/api/jobs/saved',
		saved_status: '/api/jobs/saved/status',
	},

	scrape: '/api/scrape',

	user_company_preferences: {
		list: '/api/user-company-preferences',
		by_company_id: '/api/user-company-preferences/[companyId]',
	},

	users: {
		main: '/api/users',
		check_auth: '/api/users/check-auth',
		profile: '/api/users/profile',
		query: '/api/users/query',
		register: '/api/users/register',
		login: '/api/users/login',
		emails: '/api/users/emails',
		delete: '/api/users/delete',
		forgot_password: '/api/users/forgot-password',
		update_password: '/api/users/update-password',
	},
};
