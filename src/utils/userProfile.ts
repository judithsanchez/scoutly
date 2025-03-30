export interface UserProfile {
	age: number;
	gender: string;
	yearsInTech: number;
	skills: string[];
	currentLocation: string;
	citizenship: string;
	residence: string;
	willingToRelocate: boolean;
	workPreference: string;
	previousCareers: string[];
}

// Your specific profile
export const judithSanchez: UserProfile = {
	age: 31,
	gender: 'woman',
	yearsInTech: 2,
	skills: [
		'typescript',
		'react',
		'nextjs',
		'javascript',
		'prisma',
		'docker',
		'postgresql',
		'llms',
		'ai',
		'css',
		'sass',
		'java',
		'python',
		'mysql',
	],
	currentLocation: 'Utrecht, Netherlands',
	citizenship: 'European Union',
	residence: 'Panama (Permanent)',
	willingToRelocate: true,
	workPreference:
		'Prefers remote work but willing to relocate for the right opportunity',
	previousCareers: ['Physical Therapist', 'Spanish Teacher'],
};
