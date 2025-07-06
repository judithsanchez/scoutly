import {z} from 'zod';
import {extendZodWithOpenApi} from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const WorkModelEnum = z.enum(['FULLY_REMOTE', 'HYBRID', 'IN_OFFICE']);

export const CompanySchema = z.object({
	_id: z.string().optional(),
	companyID: z.string(),
	company: z.string(),
	careers_url: z.string().url(),
	selector: z.string().optional(),
	work_model: WorkModelEnum,
	headquarters: z.string(),
	office_locations: z.array(z.string()).optional(),
	fields: z.array(z.string()),
	openToApplication: z.boolean().optional(),
	lastSuccessfulScrape: z.string().datetime().optional(),
	isProblematic: z.boolean().optional(),
	scrapeErrors: z.array(z.string()).optional(), // ObjectId as string
	createdAt: z.string().datetime().optional(),
	updatedAt: z.string().datetime().optional(),
});

export const CreateCompanyRequestSchema = CompanySchema.omit({
	_id: true,
	createdAt: true,
	updatedAt: true,
	lastSuccessfulScrape: true,
	isProblematic: true,
	scrapeErrors: true,
	openToApplication: true,
}).openapi('CreateCompanyRequest', {
	description: 'Request body for creating a new company',
	example: {
		companyID: 'acme-123',
		company: 'Acme Corp',
		careers_url: 'https://acme.com/careers',
		work_model: 'HYBRID',
		headquarters: 'New York, NY',
		fields: ['Tech', 'Finance'],
		selector: '.job-listing',
		office_locations: ['New York, NY', 'Remote'],
	},
});

export const CreateCompanyResponseSchema = z
	.object({
		success: z.boolean(),
		message: z.string(),
		company: CompanySchema,
	})
	.openapi('CreateCompanyResponse', {
		description: 'Response for successful company creation',
		example: {
			success: true,
			message: 'Company created successfully',
			company: {
				_id: '60f1b2b3c4d5e6f7a8b9c0d1',
				companyID: 'acme-123',
				company: 'Acme Corp',
				careers_url: 'https://acme.com/careers',
				selector: '.job-listing',
				work_model: 'HYBRID',
				headquarters: 'New York, NY',
				office_locations: ['New York, NY', 'Remote'],
				fields: ['Tech', 'Finance'],
				openToApplication: true,
				lastSuccessfulScrape: '2023-07-16T10:30:00.000Z',
				isProblematic: false,
				scrapeErrors: [],
				createdAt: '2023-07-16T10:30:00.000Z',
				updatedAt: '2023-07-16T10:30:00.000Z',
			},
		},
	});

export const UpdateRankingsResponseSchema = z
	.object({
		success: z.boolean(),
		message: z.string(),
	})
	.openapi('UpdateRankingsResponse', {
		description: 'Response for updating company rankings',
		example: {
			success: true,
			message:
				'Successfully processed 10 companies (8 updated, 2 added) with ranking 75',
		},
	});

export const GetCompaniesResponseSchema = z
	.array(CompanySchema)
	.openapi('GetCompaniesResponse', {
		description: 'Array of company objects',
		example: [
			{
				_id: '60f1b2b3c4d5e6f7a8b9c0d1',
				companyID: 'acme-123',
				company: 'Acme Corp',
				careers_url: 'https://acme.com/careers',
				selector: '.job-listing',
				work_model: 'HYBRID',
				headquarters: 'New York, NY',
				office_locations: ['New York, NY', 'Remote'],
				fields: ['Tech', 'Finance'],
				openToApplication: true,
				lastSuccessfulScrape: '2023-07-16T10:30:00.000Z',
				isProblematic: false,
				scrapeErrors: [],
				createdAt: '2023-07-16T10:30:00.000Z',
				updatedAt: '2023-07-16T10:30:00.000Z',
			},
		],
	});

export type Company = z.infer<typeof CompanySchema>;
export type GetCompaniesResponse = z.infer<typeof GetCompaniesResponseSchema>;
export type CreateCompanyRequest = z.infer<typeof CreateCompanyRequestSchema>;
export type CreateCompanyResponse = z.infer<typeof CreateCompanyResponseSchema>;
export type UpdateRankingsResponse = z.infer<
	typeof UpdateRankingsResponseSchema
>;
