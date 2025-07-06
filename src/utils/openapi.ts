import {
	OpenApiGeneratorV3,
	OpenAPIRegistry,
} from '@asteasolutions/zod-to-openapi';
import {
	CreateUserRequestSchema,
	CreateUserResponseSchema,
	GetUsersResponseSchema,
	ErrorResponseSchema,
} from '@/schemas/userSchemas';

import {
	QueryUsersRequestSchema,
	QueryUsersSingleResponseSchema,
	QueryUsersMultipleResponseSchema,
} from '@/schemas/userQuerySchemas';

// Create OpenAPI registry
const registry = new OpenAPIRegistry();

// Register schemas
registry.register('CreateUserRequest', CreateUserRequestSchema);
registry.register('CreateUserResponse', CreateUserResponseSchema);
registry.register('GetUsersResponse', GetUsersResponseSchema);
registry.register('ErrorResponse', ErrorResponseSchema);

import {
	GetCompaniesResponseSchema,
	CreateCompanyRequestSchema,
	CreateCompanyResponseSchema,
	UpdateRankingsResponseSchema,
} from '@/schemas/companySchemas';
import {z} from 'zod';

registry.registerPath({
	method: 'post',
	path: '/api/users',
	description: 'Create a new user',
	summary: 'Register a new user account',
	tags: ['Users'],
	request: {
		body: {
			content: {
				'application/json': {
					schema: CreateUserRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: 'User created successfully',
			content: {
				'application/json': {
					schema: CreateUserResponseSchema,
				},
			},
		},
		400: {
			description: 'Invalid request body',
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: 'Internal server error',
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

// Register /api/users/query
registry.registerPath({
	method: 'post',
	path: '/api/users/query',
	description: 'Query users by email(s) and get enriched user data',
	summary: 'Query users (single or batch)',
	tags: ['Users'],
	request: {
		body: {
			content: {
				'application/json': {
					schema: QueryUsersRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: 'Enriched user(s) data',
			content: {
				'application/json': {
					schema: QueryUsersSingleResponseSchema, // For single user
				},
				'application/json;multiple': {
					schema: QueryUsersMultipleResponseSchema, // For multiple users
				},
			},
		},
		400: {
			description: 'Invalid request body',
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
		},
		404: {
			description: 'User not found',
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: 'Internal server error',
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

/**
 * POST /api/admin/seed-companies
 * Seeds the companies collection with test data.
 */
registry.registerPath({
	method: 'post',
	path: '/api/admin/seed-companies',
	description: 'Seed the companies collection with test data',
	summary: 'Seed companies (development only)',
	tags: ['Companies'],
	responses: {
		200: {
			description: 'Companies seeded successfully',
			content: {
				'application/json': {
					schema: z.object({
						success: z.boolean(),
					}),
				},
			},
		},
		500: {
			description: 'Internal server error',
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

// Register /api/companies/create (POST)
registry.registerPath({
	method: 'post',
	path: '/api/companies/create',
	description: 'Create a new company',
	summary: 'Create company',
	tags: ['Companies'],
	request: {
		body: {
			content: {
				'application/json': {
					schema: CreateCompanyRequestSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: 'Company created successfully',
			content: {
				'application/json': {
					schema: CreateCompanyResponseSchema,
				},
			},
		},
		400: {
			description: 'Invalid request body or duplicate company',
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
		},
		500: {
			description: 'Internal server error',
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

// Register /api/companies/update-rankings (POST)
registry.registerPath({
	method: 'post',
	path: '/api/companies/update-rankings',
	description: 'Update company rankings for the default user',
	summary: 'Update company rankings',
	tags: ['Companies'],
	responses: {
		200: {
			description: 'Company rankings updated successfully',
			content: {
				'application/json': {
					schema: UpdateRankingsResponseSchema,
				},
			},
		},
		500: {
			description: 'Internal server error',
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

// Register /api/companies (GET)
registry.registerPath({
	method: 'get',
	path: '/api/companies',
	description: 'Get all companies',
	summary: 'Retrieve all companies',
	tags: ['Companies'],
	responses: {
		200: {
			description: 'Companies retrieved successfully',
			content: {
				'application/json': {
					schema: GetCompaniesResponseSchema,
				},
			},
		},
		500: {
			description: 'Internal server error',
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

registry.registerPath({
	method: 'get',
	path: '/api/users',
	description: 'Get all users',
	summary: 'Retrieve all users with their saved jobs',
	tags: ['Users'],
	responses: {
		200: {
			description: 'Users retrieved successfully',
			content: {
				'application/json': {
					schema: GetUsersResponseSchema,
				},
			},
		},
		500: {
			description: 'Internal server error',
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

// Generate OpenAPI document
const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiDocument = generator.generateDocument({
	openapi: '3.0.0',
	info: {
		version: '1.0.0',
		title: 'Scoutly API',
		description:
			'Job listing aggregator API with advanced scraping capabilities',
		contact: {
			name: 'Scoutly Support',
			email: 'support@scoutly.com',
		},
		license: {
			name: 'MIT',
			url: 'https://opensource.org/licenses/MIT',
		},
	},
	servers: [
		{
			url: 'http://localhost:3000',
			description: 'Development server',
		},
		{
			url: 'https://api.scoutly.com',
			description: 'Production server',
		},
	],
	tags: [
		{
			name: 'Users',
			description: 'User management operations',
		},
	],
});

// Export for use in API routes or documentation generation
export {registry};
