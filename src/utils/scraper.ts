import playwright from 'playwright';
import * as cheerio from 'cheerio';
import {Logger} from '@/utils/logger';
import {matchesFilters} from '@/utils/filters';

const logger = new Logger('Scraper');

export interface ScrapeRequest {
	url: string;
	selector?: string;
	company?: string; // Optional company name for error reporting
}

export interface JobData {
	url: string;
	title?: string;
	location?: string;
	description?: string;
}

export interface ScrapeResult {
	content: string;
	jobs: JobData[];
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

async function logSelectorError(
	company: string,
	url: string,
	selector: string,
	error: string,
): Promise<void> {
	try {
		const errorLog: SelectorError = {
			company,
			url,
			selector,
			error,
			timestamp: new Date().toISOString(),
		};

		// Store in memory
		selectorErrors.push(errorLog);

		// Write to file in src/logs
		try {
			const fs = require('fs/promises');
			const path = require('path');
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const errorDir = path.join(process.cwd(), 'src', 'logs');

			// Ensure error directory exists
			await fs.access(errorDir).catch(async () => {
				await fs.mkdir(errorDir, {recursive: true});
			});

			const errorFile = path.join(
				errorDir,
				`selector-errors-${timestamp}.json`,
			);
			await fs.writeFile(
				errorFile,
				JSON.stringify(
					{
						...errorLog,
						date: new Date().toLocaleDateString(),
						time: new Date().toLocaleTimeString(),
					},
					null,
					2,
				),
				'utf8',
			);
			logger.info(`Selector error logged to: ${errorFile}`);
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error';
			logger.error('Failed to write selector error to file:', errorMessage);
		}
	} catch (e) {
		logger.error('Error in logSelectorError:', e);
	}
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
		const allJobs: Set<JobData> = new Set();
		let currentPage = 1;
		const maxPages = 5;

		// If no selector provided, scrape the entire page body
		if (!selector) {
			logger.info('Scraping entire page content');
			const html = await page.content();
			const $ = cheerio.load(html);
			const content = $('body').html() || '';
			allContent.push(content);

			// Extract all URLs and attempt to find associated job info from surrounding content
			const jobs = new Map<string, JobData>();
			$('a').each((_, el) => {
				const $el = $(el);
				const href = $el.attr('href');
				if (href) {
					try {
						const absoluteUrl = new URL(href, url).toString();
						if (!jobs.has(absoluteUrl)) {
							// Try to find a job title/description in surrounding elements
							const parentText = $el.parent().text().trim();
							const title = $el.text().trim() || undefined;
							const description =
								title && parentText !== title ? parentText : undefined;

							// Check if any field matches the filters
							const titleMatch = title && matchesFilters(title);
							const descriptionMatch =
								description && matchesFilters(description);
							const urlMatch = absoluteUrl && matchesFilters(absoluteUrl);

							// Only add if it passes our filters (matches positive filters AND doesn't match negative filters)
							if (titleMatch || descriptionMatch || urlMatch) {
								jobs.set(absoluteUrl, {
									url: absoluteUrl,
									title,
									description,
								});
							}
						}
					} catch (e) {
						logger.warn(`Invalid URL found: ${href}`);
					}
				}
			});

			// Add jobs to our set
			Array.from(jobs.values()).forEach(job => allJobs.add(job));
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
						await logSelectorError(company, url, selector, errorMsg);
					}

					// Fall back to processing the entire page
					logger.info('Falling back to processing entire page content');
					const html = await page.content();
					const $ = cheerio.load(html);
					const content = $('body').html() || '';
					allContent.push(content);

					// Extract all job-related links and their surrounding content
					$('a').each((_, el) => {
						const $el = $(el);
						const href = $el.attr('href');
						if (href) {
							try {
								const absoluteUrl = new URL(href, url).toString();
								// Check if URL might be a job posting
								if (
									absoluteUrl.includes('greenhouse.io') ||
									absoluteUrl.includes('/jobs/')
								) {
									const title = $el.text().trim();
									// Clean up the title by removing "Apply Now" and splitting location
									let cleanTitle = title.replace(/Apply Now→$/, '').trim();
									let location;

									// Extract location if it starts with "Remote" or contains a dash
									const locationMatch = cleanTitle.match(
										/(Remote.*?)(?=Apply|$)/,
									);
									if (locationMatch) {
										location = locationMatch[1].trim();
										cleanTitle = cleanTitle.replace(location, '').trim();
										// Remove any remaining dash
										cleanTitle = cleanTitle.replace(/\s*[-—]\s*$/, '');
									}

									// Get the containing div for more context
									const jobDiv = $el.closest('div');
									const description = jobDiv.length
										? jobDiv.text().trim()
										: undefined;

									// Check if any field matches the filters
									const titleMatch = cleanTitle && matchesFilters(cleanTitle);
									const descriptionMatch =
										description && matchesFilters(description);
									const urlMatch = absoluteUrl && matchesFilters(absoluteUrl);

									// Only add if it passes our filters (matches positive filters AND doesn't match negative filters)
									if (titleMatch || descriptionMatch || urlMatch) {
										allJobs.add({
											url: absoluteUrl,
											title: cleanTitle,
											location: location,
											description:
												description !== title ? description : undefined,
										});
									}
								}
							} catch (e) {
								logger.warn(`Invalid URL found: ${href}`);
							}
						}
					});

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

				// Extract URLs and job info
				const jobs = new Map<string, JobData>();
				let urlCount = 0;
				selectedElement.find('a').each((_, el) => {
					const $el = $(el);
					const href = $el.attr('href');
					if (href) {
						try {
							const absoluteUrl = new URL(href, url).toString();
							if (!jobs.has(absoluteUrl)) {
								const parentElement = $el.closest(selector) || $el.parent();
								const title = $el.text().trim() || undefined;
								const description = parentElement.text().trim();

								// Check if any field matches the filters
								const titleMatch = title && matchesFilters(title);
								const descriptionMatch =
									description && matchesFilters(description);
								const urlMatch = absoluteUrl && matchesFilters(absoluteUrl);

								// Only add if it passes our filters (matches positive filters AND doesn't match negative filters)
								if (titleMatch || descriptionMatch || urlMatch) {
									jobs.set(absoluteUrl, {
										url: absoluteUrl,
										title,
										description:
											description !== title ? description : undefined,
									});
									urlCount++;
								}
							}
						} catch (e) {
							logger.warn(`Invalid URL found: ${href}`);
						}
					}
				});

				// Add jobs to our set
				Array.from(jobs.values()).forEach(job => allJobs.add(job));
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
			jobs: Array.from(allJobs),
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
