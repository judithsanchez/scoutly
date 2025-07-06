/**
 * OpenAPI (Swagger) documentation for user-company-preferences endpoints and promote user to admin.
 *
 * These endpoints are all Zod-validated and return 400/404 errors with details.
 */

export const userCompanyPreferencesOpenApi = {
	paths: {
		'/api/user-company-preferences': {
			// ... (existing docs unchanged)
		},
		'/api/users/promote': {
			patch: {
				summary: 'Promote user to admin',
				description:
					'Promotes an existing user to admin by creating an AdminUser record. Requires X-Internal-API-Secret header.',
				tags: ['AdminUser'],
				security: [
					{
						'X-Internal-API-Secret': [],
					},
				],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									email: {type: 'string', format: 'email'},
									role: {
										type: 'string',
										enum: ['super_admin', 'admin', 'moderator'],
										description: 'Optional, default is "admin"',
									},
								},
								required: ['email'],
							},
							example: {
								email: 'user@example.com',
								role: 'admin',
							},
						},
					},
				},
				responses: {
					200: {
						description: 'User promoted to admin',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										email: {type: 'string'},
										role: {type: 'string'},
										createdBy: {type: 'string'},
										isActive: {type: 'boolean'},
										permissions: {type: 'array', items: {type: 'string'}},
										createdAt: {type: 'string', format: 'date-time'},
										updatedAt: {type: 'string', format: 'date-time'},
									},
								},
								example: {
									email: 'user@example.com',
									role: 'admin',
									createdBy: 'api',
									isActive: true,
									permissions: [],
									createdAt: '2025-07-06T19:00:00.000Z',
									updatedAt: '2025-07-06T19:00:00.000Z',
								},
							},
						},
					},
					400: {
						description: 'Already admin or invalid input',
						content: {
							'application/json': {
								schema: {type: 'object'},
								examples: {
									alreadyAdmin: {
										value: {error: 'User is already an admin'},
									},
									invalidInput: {
										value: {
											error: 'Invalid request body',
											details: [
												{
													code: 'invalid_type',
													expected: 'string',
													received: 'number',
													path: ['email'],
													message: 'Expected string, received number',
												},
											],
										},
									},
								},
							},
						},
					},
					401: {
						description: 'Missing or invalid X-Internal-API-Secret header',
						content: {
							'application/json': {
								schema: {type: 'object'},
								example: {
									error: 'Missing or invalid X-Internal-API-Secret header',
								},
							},
						},
					},
					404: {
						description: 'User not found',
						content: {
							'application/json': {
								schema: {type: 'object'},
								example: {error: 'User not found'},
							},
						},
					},
					500: {
						description: 'Internal server error',
						content: {
							'application/json': {
								schema: {type: 'object'},
								example: {error: 'Internal server error'},
							},
						},
					},
				},
			},
		},
	},
	components: {
		securitySchemes: {
			'X-Internal-API-Secret': {
				type: 'apiKey',
				in: 'header',
				name: 'X-Internal-API-Secret',
			},
		},
	},
};
