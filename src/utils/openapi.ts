/**
 * OpenAPI (Swagger) documentation for user-company-preferences endpoints.
 *
 * These endpoints are all Zod-validated and return 400/404 errors with details.
 */

export const userCompanyPreferencesOpenApi = {
	paths: {
		'/api/user-company-preferences': {
			post: {
				summary: 'Track a company (create user-company-preference)',
				description:
					'Creates a new user-company-preference record. Fails if already exists.',
				tags: ['UserCompanyPreferences'],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									email: {type: 'string', format: 'email'},
									companyId: {type: 'string'},
									isTracking: {
										type: 'boolean',
										description: 'Optional, default true',
									},
									rank: {type: 'number', description: 'Optional, 1-100'},
								},
								required: ['email', 'companyId'],
							},
							example: {
								email: 'user@example.com',
								companyId: 'acme-123',
								rank: 85,
							},
						},
					},
				},
				responses: {
					201: {
						description: 'Created',
						content: {
							'application/json': {
								schema: {type: 'object'},
							},
						},
					},
					400: {
						description: 'Already tracking or invalid input',
						content: {
							'application/json': {
								schema: {type: 'object'},
								example: {
									error: 'User is already tracking this company',
								},
							},
						},
					},
				},
			},
			patch: {
				summary: 'Update user-company-preference (rank/frequency)',
				description:
					'Updates rank and/or frequency for an existing user-company-preference.',
				tags: ['UserCompanyPreferences'],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									email: {type: 'string', format: 'email'},
									companyId: {type: 'string'},
									rank: {type: 'number', description: 'Optional, 1-100'},
									frequency: {
										type: 'string',
										enum: [
											'Daily',
											'Every 2 days',
											'Weekly',
											'Bi-weekly',
											'Monthly',
										],
										description: 'Optional, case-insensitive',
									},
								},
								required: ['email', 'companyId'],
							},
							example: {
								email: 'user@example.com',
								companyId: 'acme-123',
								rank: 90,
								frequency: 'Monthly',
							},
						},
					},
				},
				responses: {
					200: {
						description: 'Updated',
						content: {
							'application/json': {
								schema: {type: 'object'},
							},
						},
					},
					400: {
						description: 'Invalid input',
						content: {
							'application/json': {
								schema: {type: 'object'},
								example: {
									error:
										'Invalid frequency. Valid options: Daily, Every 2 days, Weekly, Bi-weekly, Monthly',
								},
							},
						},
					},
					404: {
						description: 'Not found',
						content: {
							'application/json': {
								schema: {type: 'object'},
								example: {
									error: 'User is not tracking this company',
								},
							},
						},
					},
				},
			},
			delete: {
				summary: 'Untrack a company (delete user-company-preference)',
				description:
					'Deletes the user-company-preference record for a user and company.',
				tags: ['UserCompanyPreferences'],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: {
								type: 'object',
								properties: {
									email: {type: 'string', format: 'email'},
									companyId: {type: 'string'},
								},
								required: ['email', 'companyId'],
							},
							example: {
								email: 'user@example.com',
								companyId: 'acme-123',
							},
						},
					},
				},
				responses: {
					200: {
						description: 'Deleted',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										success: {type: 'boolean'},
									},
								},
								example: {success: true},
							},
						},
					},
					404: {
						description: 'Not found',
						content: {
							'application/json': {
								schema: {type: 'object'},
								example: {
									error: 'User is not tracking this company',
								},
							},
						},
					},
				},
			},
		},
	},
};
