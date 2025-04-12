import playwright from 'playwright';
import * as cheerio from 'cheerio';
import {Logger} from '@/utils/logger';

const logger = new Logger('Scraper');

export interface ScrapeRequest {
	url: string;
	selector?: string;
	company?: string; // Optional company name for error reporting
}

export interface ScrapeResult {
	content: string;
	urls: string[];
	error?: string; // Optional error message
}

interface SelectorError {
	company: string;
	url: string;
	selector: string;
	error: string;
	timestamp: string;
}

// Store selector errors in memory (could be moved to database in future)
const selectorErrors: SelectorError[] = [];

function logSelectorError(
	company: string,
	url: string,
	selector: string,
	error: string,
): void {
	const errorLog: SelectorError = {
		company,
		url,
		selector,
		error,
		timestamp: new Date().toISOString(),
	};

	selectorErrors.push(errorLog);

	// Write error to file
	const fs = require('fs');
	const path = require('path');
	const errorDir = path.join(process.cwd(), 'logs');

	if (!fs.existsSync(errorDir)) {
		fs.mkdirSync(errorDir, {recursive: true});
	}

	const errorFile = path.join(errorDir, 'selector-errors.json');
	fs.writeFileSync(errorFile, JSON.stringify(selectorErrors, null, 2), 'utf8');
}

export async function scrapeWebsite(
	request: ScrapeRequest,
): Promise<ScrapeResult> {
	const {url, selector, company} = request;
	logger.info(`Starting scrape operation for URL: ${url}`);
	if (selector) {
		logger.info(`Using selector: ${selector}`);
	} else {
		logger.info('No selector provided - will scrape entire page');
	}

	const browser = await playwright.chromium.launch({headless: true});
	const page = await browser.newPage();

	try {
		logger.info('Navigating to page...');
		await page.goto(url, {waitUntil: 'networkidle'});
		logger.success('Page loaded successfully');

		logger.info('Starting auto-scroll to load lazy content...');
		await autoScroll(page);
		logger.success('Auto-scroll completed');

		const allContent: string[] = [];
		const allUrls: Set<string> = new Set();
		let currentPage = 1;
		const maxPages = 5;

		// If no selector provided, scrape the entire page body
		if (!selector) {
			logger.info('Scraping entire page content');
			const html = await page.content();
			const $ = cheerio.load(html);
			const content = $('body').html() || '';
			allContent.push(content);

			// Extract all URLs from the page
			$('a').each((_, el) => {
				const href = $(el).attr('href');
				if (href) {
					try {
						const absoluteUrl = new URL(href, url).toString();
						allUrls.add(absoluteUrl);
					} catch (e) {
						logger.warn(`Invalid URL found: ${href}`);
					}
				}
			});
		} else {
			// Process with provided selector
			while (currentPage <= maxPages) {
				logger.info(`Processing page ${currentPage}/${maxPages}`);

				try {
					logger.debug(`Waiting for selector: ${selector}`);
					await page.waitForSelector(selector, {timeout: 10000});
				} catch (e) {
					const errorMsg = `Selector not found: ${selector}`;
					logger.error(errorMsg, e);
					if (company) {
						logSelectorError(company, url, selector, errorMsg);
					}
					// Extract full page content as fallback
					const html = await page.content();
					const $ = cheerio.load(html);
					const content = $('body').html() || '';
					allContent.push(content);
					break;
				}

				await page.waitForTimeout(2000);
				logger.debug('Extracting content...');

				const html = await page.content();
				const $ = cheerio.load(html);
				const selectedElement = $(selector);

				if (!selectedElement.length) {
					logger.error(`No elements found matching selector: ${selector}`);
					break;
				}

				const content = selectedElement.html() || '';
				if (!content) {
					logger.warn('Selected element exists but has no content');
					break;
				}

				logger.debug(`Content length: ${content.length} characters`);
				allContent.push(content);

				// Extract URLs
				let urlCount = 0;
				selectedElement.find('a').each((_, el) => {
					const href = $(el).attr('href');
					if (href) {
						try {
							const absoluteUrl = new URL(href, url).toString();
							allUrls.add(absoluteUrl);
							urlCount++;
						} catch (e) {
							logger.warn(`Invalid URL found: ${href}`);
						}
					}
				});
				logger.info(`Found ${urlCount} URLs on page ${currentPage}`);

				// Check pagination
				const paginationInfo = await checkPagination(page);
				if (!paginationInfo.hasNextPage) {
					logger.info('No more pages available');
					break;
				}

				logger.debug('Attempting to navigate to next page...');
				const navigationSuccess = await navigateToNextPage(page);
				if (!navigationSuccess) {
					logger.info('Failed to navigate to next page');
					break;
				}

				currentPage++;
			}
		}

		logger.success(`Scraping completed. Processed ${currentPage} pages`);
		return {
			content: allContent.join('\n'),
			urls: Array.from(allUrls),
		};
	} catch (error) {
		logger.error('Unexpected error during scraping', error);
		throw error;
	} finally {
		logger.debug('Closing browser');
		await browser.close();
	}
}

async function checkPagination(
	page: playwright.Page,
): Promise<{hasNextPage: boolean}> {
	logger.debug('Checking pagination status...');

	interface PaginationResult {
		hasLabel: boolean;
		isValid: boolean;
		current?: number;
		total?: number;
	}

	const paginationInfo = await page.evaluate(() => {
		const rangeLabel = document.querySelector('.mat-paginator-range-label');
		if (!rangeLabel) {
			return {hasLabel: false, isValid: false} as PaginationResult;
		}

		const text = rangeLabel.textContent || '';
		const match = text.match(/(\d+)\s*[–-]\s*(\d+)\s*of\s*(\d+)/);
		if (!match) {
			return {hasLabel: true, isValid: false} as PaginationResult;
		}

		return {
			hasLabel: true,
			isValid: true,
			current: parseInt(match[2]),
			total: parseInt(match[3]),
		} as PaginationResult;
	});

	if (!paginationInfo.hasLabel) {
		logger.debug('No pagination label found');
		return {hasNextPage: false};
	}

	if (!paginationInfo.isValid) {
		logger.warn('Pagination label found but format is invalid');
		return {hasNextPage: false};
	}

	if (!paginationInfo.current || !paginationInfo.total) {
		logger.debug('Missing current or total page numbers');
		return {hasNextPage: false};
	}

	logger.debug(
		`Pagination status: ${paginationInfo.current}/${paginationInfo.total}`,
	);
	return {hasNextPage: paginationInfo.current < paginationInfo.total};
}

async function navigateToNextPage(page: playwright.Page): Promise<boolean> {
	const nextButtonEnabled = await page.evaluate(() => {
		const nextButton = document.querySelector('.mat-paginator-navigation-next');
		if (!nextButton) {
			return {exists: false};
		}
		return {
			exists: true,
			enabled: !nextButton.hasAttribute('disabled'),
			display: window.getComputedStyle(nextButton).display,
		};
	});

	if (!nextButtonEnabled.exists) {
		logger.warn('Next page button not found');
		return false;
	}

	if (!nextButtonEnabled.enabled) {
		logger.debug('Next page button is disabled');
		return false;
	}

	if (nextButtonEnabled.display === 'none') {
		logger.debug('Next page button is hidden');
		return false;
	}

	logger.debug('Clicking next page button');
	let clicked = false;
	for (let attempt = 1; attempt <= 3 && !clicked; attempt++) {
		try {
			await page.click('.mat-paginator-navigation-next');
			clicked = true;
			logger.debug('Successfully clicked next page button');
		} catch (e) {
			logger.warn(`Click attempt ${attempt}/3 failed, retrying...`);
			await page.waitForTimeout(1000);
		}
	}

	if (!clicked) {
		logger.error('Failed to click next page button after 3 attempts');
		return false;
	}

	await page.waitForTimeout(2000);
	return true;
}

async function autoScroll(page: playwright.Page): Promise<void> {
	logger.debug('Starting auto-scroll');
	await page.evaluate(async () => {
		await new Promise<void>(resolve => {
			let totalHeight = 0;
			const distance = 100;
			const maxScrolls = 30;
			let scrollCount = 0;

			const timer = setInterval(() => {
				window.scrollBy(0, distance);
				totalHeight += distance;
				scrollCount++;

				if (
					totalHeight >= document.body.scrollHeight ||
					scrollCount >= maxScrolls
				) {
					clearInterval(timer);
					resolve();
				}
			}, 200);
		});
	});

	logger.debug('Waiting for lazy-loaded content');
	await page.waitForTimeout(2000);
	logger.debug('Auto-scroll complete');
}
