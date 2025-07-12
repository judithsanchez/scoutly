import {z} from 'zod';

export const registerSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
});

export const CurrentResidenceSchema = z.object({
	city: z.string().optional(),
	country: z.string().optional(),
	countryCode: z.string().optional(),
	timezone: z.string().optional(),
});

export const WorkAuthorizationSchema = z.object({
	region: z.string().optional(),
	regionCode: z.string().optional(),
	status: z.string().optional(),
});

export const LogisticsSchema = z.object({
	currentResidence: CurrentResidenceSchema.optional(),
	willingToRelocate: z.boolean().optional(),
	workAuthorization: z.array(WorkAuthorizationSchema).optional(),
});

export const LanguageSchema = z.object({
	language: z.string().optional(),
	level: z.string().optional(),
});

export const ExclusionsSchema = z.object({
	industries: z.array(z.string()).optional(),
	technologies: z.array(z.string()).optional(),
	roleTypes: z.array(z.string()).optional(),
});

export const PreferencesSchema = z.object({
	careerGoals: z.array(z.string()).optional(),
	jobTypes: z.array(z.string()).optional(),
	workEnvironments: z.array(z.string()).optional(),
	companySizes: z.array(z.string()).optional(),
	exclusions: ExclusionsSchema.optional(),
});

export const CandidateInfoSchema = z.object({
	logistics: LogisticsSchema.optional(),
	languages: z.array(LanguageSchema).optional(),
	preferences: PreferencesSchema.optional(),
});
