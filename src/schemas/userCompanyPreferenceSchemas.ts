import {z} from 'zod';

export const UserCompanyPreferenceCreateSchema = z.object({
	userId: z.string(),
	companyId: z.string(),
	rank: z.number().min(1).max(100).optional(),
	isTracking: z.boolean().optional(),
	frequency: z
		.enum(['Daily', 'Every 2 days', 'Weekly', 'Bi-weekly', 'Monthly'])
		.optional(),
});

export const UserCompanyPreferenceUpdateSchema = z.object({
	rank: z.number().min(1).max(100).optional(),
	isTracking: z.boolean().optional(),
	frequency: z
		.enum(['Daily', 'Every 2 days', 'Weekly', 'Bi-weekly', 'Monthly'])
		.optional(),
});
