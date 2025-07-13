import {z} from 'zod';

export const UserCompanyPreferenceResponseSchema = z.object({
	_id: z.string(),
	userId: z.string(),
	companyId: z.string(),
	rank: z.number().min(1).max(100),
	isTracking: z.boolean(),
	frequency: z
		.enum(['Daily', 'Every 2 days', 'Weekly', 'Bi-weekly', 'Monthly'])
		.optional(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const UserCompanyPreferenceArrayResponseSchema = z.array(
	UserCompanyPreferenceResponseSchema,
);
