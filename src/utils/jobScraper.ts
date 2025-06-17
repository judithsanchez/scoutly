/**
 * Job scraping utilities for filtering and processing job links
 */

import {scrapeWebsite, type ScrapeResult, type ExtractedLink} from './scraper';
import {Logger} from './logger';

const logger = new Logger('JobScraper');

/**
 * Keywords that typically indicate non-job links that should be filtered out
 */
export const NON_JOB_KEYWORDS = [
	'login',
	'sign',
	'cookie',
	'privacy',
	'terms',
	'about',
	'contact',
	'help',
	'support',
	'blog',
	'news',
	'events',
] as const;

/**
 * Filters out links that are likely not job postings
 *
 * @param links - Array of extracted links to filter
 * @param minTitleLength - Minimum title length to consider (default: 5)
 * @returns Filtered array of links
 */
export function filterNonJobLinks(
	links: ExtractedLink[],
	minTitleLength: number = 5,
): ExtractedLink[] {
	const filteredLinks = links.filter(link => {
		const title = link.text.toLowerCase();

		// Filter by minimum length
		if (title.length < minTitleLength) {
			logger.debug(`Filtered out short link: ${link.text}`);
			return false;
		}

		// Filter by non-job keywords
		for (const keyword of NON_JOB_KEYWORDS) {
			if (title.includes(keyword)) {
				logger.debug(`Filtered out non-job link: ${link.text}`);
				return false;
			}
		}

		return true;
	});

	logger.info(
		`Early filtering reduced links from ${links.length} to ${filteredLinks.length}`,
	);

	return filteredLinks;
}

/**
 * Scrapes a website for job links and applies filtering
 *
 * @param url - URL to scrape
 * @param minTitleLength - Minimum title length for filtering
 * @returns Scrape result with filtered links
 */
export async function scrapeJobsWithFiltering(
	url: string,
	minTitleLength: number = 5,
): Promise<ScrapeResult> {
	const result = await scrapeWebsite({url});

	if (result.links.length > 0) {
		result.links = filterNonJobLinks(result.links, minTitleLength);
	}

	return result;
}

/**
 * Scrapes job details from multiple URLs with retry logic
 *
 * @param urls - Array of URLs to scrape
 * @param options - Scraping options
 * @returns Map of URL to content
 */
export async function scrapeJobDetails(
	urls: string[],
	options: {
		timeout?: number;
		waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
		maxRetries?: number;
		baseDelay?: number;
		maxBackoff?: number;
	} = {},
): Promise<Map<string, string>> {
	const {
		timeout = 120000,
		waitUntil = 'networkidle',
		maxRetries = 5,
		baseDelay = 1000,
		maxBackoff = 30000,
	} = options;

	const contents = new Map<string, string>();

	const results = await Promise.all(
		urls.map(async url => {
			const scrapeStart = Date.now();
			let attempts = 0;
			let lastError: any;

			while (attempts < maxRetries) {
				try {
					const result = await scrapeWebsite({
						url,
						options: {timeout, waitUntil},
					});

					if (result.error) {
						throw new Error(result.error);
					}

					return {url, content: result.content};
				} catch (error) {
					attempts++;
					lastError = error;

					if (attempts < maxRetries) {
						const backoffTime = Math.min(
							baseDelay * Math.pow(2, attempts - 1),
							maxBackoff,
						);
						logger.warn(
							`Retry ${attempts}/${maxRetries} for ${url} in ${backoffTime}ms`,
						);
						await new Promise(resolve => setTimeout(resolve, backoffTime));
					}
				}
			}

			logger.error(
				`Failed to scrape ${url} after ${maxRetries} attempts in ${
					Date.now() - scrapeStart
				}ms:`,
				lastError,
			);
			return null;
		}),
	);

	// Process results
	results.forEach(result => {
		if (result) {
			contents.set(result.url, result.content);
		}
	});

	return contents;
}
