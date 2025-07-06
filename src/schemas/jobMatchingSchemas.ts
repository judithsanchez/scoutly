import {z} from 'zod';

/**
 * Zod schema for a single matched job result, matching the AI's deepDiveSchema.
 * Many fields are optional, as the AI may omit them.
 */
export const JobMatchResultSchema = z.object({
	title: z.string(),
	url: z.string(),
	location: z.string().optional(),
	timezone: z.string().optional(),
	salary: z
		.object({
			min: z.number().optional(),
			max: z.number().optional(),
			currency: z.string().optional(),
			period: z.string().optional(),
		})
		.optional(),
	techStack: z.array(z.string()).optional(),
	experienceLevel: z.string().optional(),
	languageRequirements: z.array(z.string()).optional(),
	visaSponsorshipOffered: z.boolean().optional(),
	relocationAssistanceOffered: z.boolean().optional(),
	goodFitReasons: z.array(z.string()),
	considerationPoints: z.array(z.string()),
	stretchGoals: z.array(z.string()),
	suitabilityScore: z.number(),
});

/**
 * Zod schema for a single company result in the orchestrator response.
 */
export const JobMatchingCompanyResultSchema = z.object({
	company: z.string(),
	processed: z.boolean(),
	results: z.array(JobMatchResultSchema),
	error: z.string().optional(),
	companyId: z.string().optional(),
});

/**
 * Zod schema for the orchestrator job matching endpoint response.
 */
export const JobMatchingResponseSchema = z.object({
	results: z.array(JobMatchingCompanyResultSchema),
});

export type JobMatchResult = z.infer<typeof JobMatchResultSchema>;
export type JobMatchingCompanyResult = z.infer<
	typeof JobMatchingCompanyResultSchema
>;
export type JobMatchingResponse = z.infer<typeof JobMatchingResponseSchema>;
