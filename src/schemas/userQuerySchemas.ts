import {z} from 'zod';
import {extendZodWithOpenApi} from '@asteasolutions/zod-to-openapi';
import {CandidateInfoSchema} from './userSchemas';

extendZodWithOpenApi(z);

export const QueryUsersRequestSchema = z
	.object({
		emails: z.array(z.string().email()).optional(),
		email: z.string().email().optional(),
	})
	.refine(
		data =>
			!!data.email || (Array.isArray(data.emails) && data.emails.length > 0),
		{message: 'Either "email" (string) or "emails" (array) is required'},
	)
	.openapi('QueryUsersRequest', {
		description: 'Request body for querying users by email(s)',
		example: {
			emails: ['user1@example.com', 'user2@example.com'],
		},
	});

const UserPreferenceSchema = z.object({
	rank: z.number(),
	isTracking: z.boolean(),
	frequency: z.string(),
	lastUpdated: z.string(),
});

const TrackedCompanySchema = z.object({
	_id: z.string(),
	companyID: z.string().optional(),
	company: z.string(),
	careers_url: z.string().url().optional(),
	logo_url: z.string().url().optional(),
	work_model: z.string().optional(),
	headquarters: z.string().optional(),
	office_locations: z.array(z.string()).optional(),
	fields: z.array(z.string()).optional(),
	userPreference: UserPreferenceSchema,
});

const SavedJobSchema = z.object({
	_id: z.string(),
	userId: z.string(),
	jobId: z.string(),
	companyId: z.any(),
	status: z.string(),
	notes: z.string().optional(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const EnrichedUserSchema = z.object({
	_id: z.string(),
	email: z.string().email(),
	cvUrl: z.string().url().optional(),
	candidateInfo: CandidateInfoSchema.optional(),
	createdAt: z.string(),
	updatedAt: z.string(),
	savedJobs: z.array(SavedJobSchema).optional(),
	trackedCompanies: z.array(TrackedCompanySchema).optional(),
});

export const QueryUsersSingleResponseSchema = z
	.object({
		user: EnrichedUserSchema,
	})
	.openapi('QueryUsersSingleResponse', {
		description: 'Response for querying a single user',
	});

export const QueryUsersMultipleResponseSchema = z
	.object({
		users: z.array(EnrichedUserSchema),
	})
	.openapi('QueryUsersMultipleResponse', {
		description: 'Response for querying multiple users',
	});

export type QueryUsersRequest = z.infer<typeof QueryUsersRequestSchema>;
export type QueryUsersSingleResponse = z.infer<
	typeof QueryUsersSingleResponseSchema
>;
export type QueryUsersMultipleResponse = z.infer<
	typeof QueryUsersMultipleResponseSchema
>;
