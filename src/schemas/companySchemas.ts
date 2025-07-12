import {z} from 'zod';

// Zod schema for Company
export const CompanyZodSchema = z.object({
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
	// Add any other fields as needed
});

// TypeScript type generated from Zod schema
export type Company = z.infer<typeof CompanyZodSchema>;

// Example: array schema for validation of multiple companies
export const CompaniesArrayZodSchema = z.array(CompanyZodSchema);
