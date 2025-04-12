export const positiveFilters = [
	'junior',
	'entry-level',
	'entry level',
	'entrylevel',
	'entry',
	'engineer',
	'developer',
	'coder',
	'programmer',
	'software',
	'fullstack',
	'full-stack',
	'full stack',
	'backend',
	'back-end',
	'back end',
	'frontend',
	'front-end',
	'front end',
	'typescript',
	'javascript',
	'python',
	'node',
	'react',
	'ai',
];

export const negativeFilters = [
	'lead',
	'staff',
	'principal',
	'architect',
	'manager',
	'senior',
	'android',
	'ios',
	'systems',
	'cloud',
	'devops',
	'wordpress',
	'platform',
	'executive',
	'enterprise',
	'reliability',
	'mailto:',
];

export function matchesFilters(text: string): boolean {
	if (!text) return false;
	const lowerText = text.toLowerCase();

	// First check if it matches any positive filter
	const hasPositiveMatch = positiveFilters.some(filter =>
		lowerText.includes(filter.toLowerCase()),
	);

	if (!hasPositiveMatch) return false;

	// If it matches positive, check it doesn't match negative
	const hasNegativeMatch = negativeFilters.some(filter =>
		lowerText.includes(filter.toLowerCase()),
	);

	return !hasNegativeMatch;
}
