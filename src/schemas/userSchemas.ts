import {z} from 'zod';
import {extendZodWithOpenApi} from '@asteasolutions/zod-to-openapi';

// Extend zod with OpenAPI support
extendZodWithOpenApi(z);

// Sub-schemas for CandidateInfo
const CurrentResidenceSchema = z
	.object({
		city: z.string().optional(),
		country: z.string().optional(),
		countryCode: z.string().optional(),
		timezone: z.string().optional(),
	})
	.openapi('CurrentResidence');

const WorkAuthorizationSchema = z
	.object({
		region: z.string().optional(),
		regionCode: z.string().optional(),
		status: z.string().optional(),
	})
	.openapi('WorkAuthorization');

const LogisticsSchema = z
	.object({
		currentResidence: CurrentResidenceSchema.optional(),
		willingToRelocate: z.boolean().optional(),
		workAuthorization: z.array(WorkAuthorizationSchema).optional(),
	})
	.openapi('Logistics');

const LanguageSchema = z
	.object({
		language: z.string().optional(),
		level: z.string().optional(),
	})
	.openapi('Language');

const ExclusionsSchema = z
	.object({
		industries: z.array(z.string()).optional(),
		technologies: z.array(z.string()).optional(),
		roleTypes: z.array(z.string()).optional(),
	})
	.openapi('Exclusions');

const PreferencesSchema = z
	.object({
		careerGoals: z.array(z.string()).optional(),
		jobTypes: z.array(z.string()).optional(),
		workEnvironments: z.array(z.string()).optional(),
		companySizes: z.array(z.string()).optional(),
		exclusions: ExclusionsSchema.optional(),
	})
	.openapi('Preferences');

export const CandidateInfoSchema = z
	.object({
		logistics: LogisticsSchema.optional(),
		languages: z.array(LanguageSchema).optional(),
		preferences: PreferencesSchema.optional(),
	})
	.openapi('CandidateInfo');

// Request schema for POST /api/users
export const CreateUserRequestSchema = z
	.object({
		email: z.string().email('Must be a valid email address'),
		cvUrl: z.string().url('Must be a valid URL').optional(),
		candidateInfo: CandidateInfoSchema.optional(),
	})
	.openapi('CreateUserRequest', {
		description: 'Request body for creating a new user',
		example: {
			email: 'user@example.com',
			cvUrl: 'https://example.com/cv.pdf',
			candidateInfo: {
				logistics: {
					currentResidence: {
						city: 'Amsterdam',
						country: 'Netherlands',
						countryCode: 'NL',
						timezone: 'Europe/Amsterdam',
					},
					willingToRelocate: true,
					workAuthorization: [
						{
							region: 'Europe',
							regionCode: 'EU',
							status: 'Authorized',
						},
					],
				},
				languages: [
					{
						language: 'English',
						level: 'Native',
					},
				],
				preferences: {
					careerGoals: ['Software Engineer', 'Tech Lead'],
					jobTypes: ['Full-time'],
					workEnvironments: ['Remote', 'Hybrid'],
					companySizes: ['Startup', 'Mid-size'],
				},
			},
		},
	});

// Response schema for POST /api/users
export const CreateUserResponseSchema = z
	.object({
		success: z.boolean(),
		user: z.object({
			_id: z.string(),
			email: z.string().email(),
			cvUrl: z.string().url().optional(),
			candidateInfo: CandidateInfoSchema.optional(),
			createdAt: z.string(),
			updatedAt: z.string(),
		}),
		message: z.string(),
	})
	.openapi('CreateUserResponse', {
		description: 'Response for successful user creation',
		example: {
			success: true,
			user: {
				_id: '60f1b2b3c4d5e6f7a8b9c0d1',
				email: 'user@example.com',
				cvUrl: 'https://example.com/cv.pdf',
				candidateInfo: {
					logistics: {
						currentResidence: {
							city: 'Amsterdam',
							country: 'Netherlands',
							countryCode: 'NL',
							timezone: 'Europe/Amsterdam',
						},
						willingToRelocate: true,
					},
				},
				createdAt: '2023-07-16T10:30:00.000Z',
				updatedAt: '2023-07-16T10:30:00.000Z',
			},
			message: 'User registered successfully',
		},
	});

// Error response schema
export const ErrorResponseSchema = z
	.object({
		error: z.string(),
		details: z.any().optional(),
	})
	.openapi('ErrorResponse', {
		description: 'Error response',
		example: {
			error: 'Email is required',
		},
	});

// Response schema for GET /api/users
export const GetUsersResponseSchema = z
	.object({
		users: z.array(
			z.object({
				_id: z.string(),
				email: z.string().email(),
				cvUrl: z.string().url().optional(),
				candidateInfo: CandidateInfoSchema.optional(),
				createdAt: z.string(),
				updatedAt: z.string(),
				savedJobs: z.array(z.any()).optional(), // Simplified for now
			}),
		),
	})
	.openapi('GetUsersResponse', {
		description: 'Response for getting all users',
		example: {
			users: [
				{
					_id: '60f1b2b3c4d5e6f7a8b9c0d1',
					email: 'user@example.com',
					cvUrl: 'https://example.com/cv.pdf',
					createdAt: '2023-07-16T10:30:00.000Z',
					updatedAt: '2023-07-16T10:30:00.000Z',
					savedJobs: [],
				},
			],
		},
	});

// Type exports for TypeScript
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;
export type GetUsersResponse = z.infer<typeof GetUsersResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
