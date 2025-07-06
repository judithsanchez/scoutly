/**
 * Centralized frequency calculation logic for user-company preferences.
 * Always use this function as the single source of truth.
 */

export const VALID_FREQUENCIES = [
	'Daily',
	'Every 2 days',
	'Weekly',
	'Bi-weekly',
	'Monthly',
] as const;

export type Frequency = (typeof VALID_FREQUENCIES)[number];

export function calculateFrequency(rank: number | undefined): Frequency {
	if (typeof rank !== 'number') return 'Weekly';
	if (rank >= 90) return 'Daily';
	if (rank >= 75) return 'Every 2 days';
	if (rank >= 50) return 'Weekly';
	if (rank >= 25) return 'Bi-weekly';
	return 'Monthly';
}
