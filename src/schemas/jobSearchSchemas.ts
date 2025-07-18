import {z} from 'zod';

export const JobSearchRequestSchema = z.object({
	credentials: z.object({
		gmail: z.string().optional(),
	}),
	companyIds: z.array(z.string()),
	cvUrl: z.string().url(),
	candidateInfo: z.record(z.any()),
});
