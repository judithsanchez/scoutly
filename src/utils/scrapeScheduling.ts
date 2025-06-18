/**
 * Utility functions for calculating scrape intervals based on company ranking
 * and managing anacron-compatible scheduling for intermittent systems
 */

/**
 * Calculate scrape interval in milliseconds based on company rank
 * Higher ranks (closer to 100) get more frequent scraping
 *
 * @param rank - Company rank from 1-100 (100 = highest priority)
 * @returns Interval in milliseconds
 */
export function getScrapeInterval(rank: number): number {
	// Validate rank input
	if (rank < 1 || rank > 100) {
		throw new Error('Rank must be between 1 and 100');
	}

	// Ranks 81-100: Check daily (24 hours) - highest priority
	if (rank >= 81) return 24 * 60 * 60 * 1000;

	// Ranks 61-80: Check every 2 days
	if (rank >= 61) return 2 * 24 * 60 * 60 * 1000;

	// Ranks 31-60: Check every 3 days
	if (rank >= 31) return 3 * 24 * 60 * 60 * 1000;

	// Ranks 11-30: Check every 4 days
	if (rank >= 11) return 4 * 24 * 60 * 60 * 1000;

	// Ranks 1-10: Check every 5 days (lowest priority)
	return 5 * 24 * 60 * 60 * 1000;
}

/**
 * Calculate priority score for anacron scheduling based on how overdue a company is
 *
 * @param rank - Company rank from 1-100
 * @param lastScrapedAt - Date of last successful scrape
 * @returns Priority score (higher = more urgent)
 */
export function calculateAnacronPriority(
	rank: number,
	lastScrapedAt: Date | null,
): number {
	const now = new Date();
	const interval = getScrapeInterval(rank);

	// If never scraped, use rank as base priority
	if (!lastScrapedAt) {
		return rank;
	}

	const timeSinceLastScrape = now.getTime() - lastScrapedAt.getTime();
	const overdueFactor = timeSinceLastScrape / interval;

	// Combine rank with how overdue the scrape is
	// This ensures high-rank companies that are overdue get highest priority
	return rank * Math.max(1, overdueFactor);
}

/**
 * Check if a company is due for scraping based on its rank and last scrape time
 *
 * @param rank - Company rank from 1-100
 * @param lastScrapedAt - Date of last successful scrape
 * @returns true if company should be scraped
 */
export function isCompanyDueForScraping(
	rank: number,
	lastScrapedAt: Date | null,
): boolean {
	if (!lastScrapedAt) return true;

	const now = new Date();
	const interval = getScrapeInterval(rank);
	const timeSinceLastScrape = now.getTime() - lastScrapedAt.getTime();

	return timeSinceLastScrape >= interval;
}

/**
 * Get a human-readable description of the scrape frequency for a given rank
 *
 * @param rank - Company rank from 1-100
 * @returns Human-readable frequency description
 */
export function getScrapeFrequencyDescription(rank: number): string {
	const intervalMs = getScrapeInterval(rank);
	const days = Math.round(intervalMs / (24 * 60 * 60 * 1000));

	if (days === 1) return 'Daily';
	return `Every ${days} days`;
}
