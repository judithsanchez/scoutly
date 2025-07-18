import {z} from 'zod';

// Input schema for creating a company (no id)
export const CompanyCreateZodSchema = z.object({
	companyID: z.string(),
	company: z.string(),
	description: z.string().optional(),
	website: z.string().url().optional(),
	logo_url: z.string().url().optional(),
	careers_url: z.string().url().optional(),
	industry: z.string().optional(),
	size: z.string().optional(),
	headquarters: z.string().optional(),
	founded: z.number().int().optional(),
	work_model: z.enum(['FULLY_REMOTE', 'HYBRID', 'IN_OFFICE']).optional(),
	lastScraped: z.date().optional(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
	fields: z.array(z.string()).optional(),
	office_locations: z.array(z.string()).optional(),
	openToApplication: z.boolean().optional(),
	selector: z.string().optional(),
});

// Output schema for company (with id)
export const CompanyZodSchema = CompanyCreateZodSchema.extend({
	id: z.string(),
});

export type Company = z.infer<typeof CompanyZodSchema>;
export type CompanyCreate = z.infer<typeof CompanyCreateZodSchema>;

export const CompaniesArrayZodSchema = z.array(CompanyZodSchema);
