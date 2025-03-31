import playwright from 'playwright';
import {Logger} from '@/utils/logger';
import * as cheerio from 'cheerio';

const logger = new Logger('Scraper');

export interface ScrapeRequest {
	/** URL to scrape */
	url: string;
	/** Optional CSS selector to target specific elements */
	selector?: string;
}

export interface ScrapeResult {
	content: string;
	error?: string;
	metadata?: {
		title?: string;
		url?: string;
		characterCount?: number;
	};
	stats?: {
		pagesScraped: number;
		scrollCycles: number;
	};
}

export async function scrapeWebsite(
	request: ScrapeRequest,
): Promise<ScrapeResult> {
	let browser = null;
	const url = request.url;
	const selector = request.selector;

	logger.info(`Starting to scrape website: ${url}`);

	try {
		logger.debug('Launching browser');
		browser = await playwright.chromium.launch({
			headless: true,
		});

		logger.debug('Creating browser context');
		const context = await browser.newContext({
			userAgent:
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
			viewport: {width: 1280, height: 800},
		});

		logger.debug('Creating new page');
		const page = await context.newPage();

		// Set extra HTTP headers to appear more like a real browser
		logger.debug('Setting HTTP headers');
		await page.setExtraHTTPHeaders({
			'Accept-Language': 'en-US,en;q=0.9',
			Referer: 'https://www.google.com/',
			DNT: '1',
		});

		logger.info(`Navigating to ${url}`);
		await page.goto(url, {waitUntil: 'networkidle'});
		logger.success('Page loaded successfully');

		const result: ScrapeResult = {
			content: '',
			stats: {
				pagesScraped: 1,
				scrollCycles: 0,
			},
		};

		// Always extract basic metadata
		logger.debug('Extracting metadata');
		result.metadata = await extractBasicMetadata(page);

		logger.info('Performing initial scroll to load lazy content');
		await autoScroll(page);

		const paginationType = await detectPaginationType(page);
		logger.info(`Pagination type detected: ${paginationType}`);

		let allContent: string[] = [];

		// Extract content from the first page
		const firstPageContent = await extractCleanContent(page, selector);
		allContent.push(firstPageContent);

		if (paginationType === 'standard' || paginationType === 'angular') {
			logger.info(`Processing ${paginationType} pagination`);
			const maxPages = 5;
			let currentPage = 1;

			while (currentPage < maxPages) {
				const nextPageClicked =
					paginationType === 'angular'
						? await clickAngularNextPage(page)
						: await clickStandardNextPage(page);

				if (!nextPageClicked) {
					logger.info(
						'No more pagination links found or unable to click next page',
					);
					break;
				}

				await page.waitForLoadState('networkidle');

				if (paginationType === 'angular') {
					await page.waitForTimeout(1000);
				}

				currentPage++;
				result.stats!.pagesScraped = currentPage;
				logger.info(`Navigated to page ${currentPage}`);

				const pageContent = await extractCleanContent(page, selector);
				allContent.push(pageContent);
			}
		} else if (paginationType === 'infinite') {
			logger.info('Processing infinite scroll');
			const maxScrollCycles = 3;
			let scrollCycles = 0;

			while (scrollCycles < maxScrollCycles) {
				const currentContentLength = await page.evaluate(
					() => document.body.innerHTML.length,
				);

				const loadMoreClicked = await clickLoadMoreButton(page);

				if (!loadMoreClicked) {
					await autoScroll(page);
				}

				scrollCycles++;
				result.stats!.scrollCycles = scrollCycles;
				logger.info(`Completed scroll/load more cycle ${scrollCycles}`);

				await page.waitForTimeout(2000);

				const newContentLength = await page.evaluate(
					() => document.body.innerHTML.length,
				);

				// Check if we've loaded significant new content
				if (newContentLength <= currentContentLength * 1.05) {
					logger.info(
						'No significant new content loaded after scrolling/loading more',
					);
					break;
				}

				if (
					scrollCycles === maxScrollCycles ||
					newContentLength <= currentContentLength * 1.05
				) {
					const scrollContent = await extractCleanContent(page, selector);
					allContent = [scrollContent]; // Replace with the complete content
				}
			}
		} else {
			logger.info('No pagination detected');
		}

		result.content = allContent.join('\n\n');

		logger.info(
			`Extracted content size: ${result.content.length} characters from ${
				result.stats!.pagesScraped
			} pages`,
		);

		logger.debug('Closing browser');
		await browser.close();
		browser = null;

		result.metadata = result.metadata || {};
		result.metadata.characterCount = result.content.length;

		logger.success(`Successfully scraped website: ${url}`);
		return result;
	} catch (error) {
		logger.error('Error scraping website', error);
		return {
			content: '',
			error: `Error scraping website: ${
				error instanceof Error ? error.message : String(error)
			}`,
			stats: {
				pagesScraped: 0,
				scrollCycles: 0,
			},
		};
	} finally {
		if (browser) {
			logger.debug('Closing browser in finally block');
			await browser.close();
		}
	}
}

async function extractCleanContent(
	page: playwright.Page,
	selector?: string,
): Promise<string> {
	// Get the raw HTML first
	const html = selector
		? await page.evaluate(sel => {
				const elements = document.querySelectorAll(sel);
				return Array.from(elements)
					.map(el => el.outerHTML)
					.join('');
		  }, selector)
		: await page.content();

	// Use cheerio to parse and extract content
	const $ = cheerio.load(html);

	// Remove unwanted elements
	$('script, style, iframe, noscript, svg').remove();
	$('[style*="display:none"], [style*="display: none"]').remove();

	// Extract all links and ensure they're properly formatted
	$('a').each((_, el) => {
		const href = $(el).attr('href');
		if (href) {
			// Preserve the href attribute
			$(el).attr('data-original-href', href);

			// Convert relative URLs to absolute
			if (href.startsWith('/')) {
				const baseUrl = new URL(page.url());
				$(el).attr('href', `${baseUrl.origin}${href}`);
			}
		}
	});

	// Return the cleaned HTML
	return selector ? $.html(selector) : $.html('body');
}

async function extractBasicMetadata(
	page: playwright.Page,
): Promise<ScrapeResult['metadata']> {
	return await page.evaluate(() => {
		const metadata: any = {};

		const titleElement = document.querySelector('title');
		if (titleElement) metadata.title = titleElement.textContent || undefined;

		metadata.url = window.location.href;

		return metadata;
	});
}

async function detectPaginationType(page: playwright.Page): Promise<string> {
	return await page.evaluate(() => {
		const hasAngularPaginator = !!document.querySelector(
			'mat-paginator, .mat-paginator',
		);
		if (hasAngularPaginator) return 'angular';

		const standardPaginationSelectors = [
			'.pagination',
			'.pager',
			'.pages',
			'nav[role="navigation"]',
			'ul.page-numbers',
			'.page-navigation',
			'.page-links',
			'.wp-pagenavi',
		];

		for (const selector of standardPaginationSelectors) {
			if (document.querySelector(selector)) return 'standard';
		}

		const nextPageSelectors = [
			'a[rel="next"]',
			'a.next',
			'a.next-page',
			'a[aria-label="Next"]',
			'a:contains("Next")',
			'a:contains("Next Page")',
			'a:contains("»")',
			'a.pagination-next',
			'button:contains("Next")',
		];

		for (const selector of nextPageSelectors) {
			try {
				if (document.querySelector(selector)) return 'standard';
			} catch (e) {
				continue;
			}
		}

		const infiniteScrollIndicators = [
			'.infinite-scroll',
			'.infinite-content',
			'[data-infinite-scroll]',
			'[data-pagination="infinite"]',
			'.load-more',
			'#infinite-scroll',
			'button:contains("Load More")',
			'a:contains("Load More")',
			'button:contains("Show More")',
			'a:contains("Show More")',
			'.load-more-button',
			'.show-more-button',
			'[data-load-more]',
			'.read-more-button',
		];

		for (const selector of infiniteScrollIndicators) {
			try {
				if (document.querySelector(selector)) return 'infinite';
			} catch (e) {
				continue;
			}
		}

		const infiniteScrollLibraries = [
			'infinite-scroll',
			'infScroll',
			'ias',
			'jscroll',
			'waypoints',
		];

		for (const lib of infiniteScrollLibraries) {
			if (
				// @ts-ignore - checking global variables
				window[lib] ||
				document.querySelector(`.${lib}`) ||
				document.querySelector(`[data-${lib}]`)
			) {
				return 'infinite';
			}
		}

		return 'none';
	});
}

async function clickStandardNextPage(page: playwright.Page): Promise<boolean> {
	return await page.evaluate(() => {
		const nextPageSelectors = [
			'a[rel="next"]',
			'a.next',
			'a.next-page',
			'a[aria-label="Next"]',
			'a:contains("Next")',
			'a:contains("Next Page")',
			'a:contains("»")',
			'a.pagination-next',
			'button:contains("Next")',
		];

		for (const selector of nextPageSelectors) {
			try {
				const nextButton = document.querySelector(selector) as HTMLElement;
				if (nextButton && nextButton.offsetParent !== null) {
					// Check if visible
					nextButton.click();
					return true;
				}
			} catch (e) {
				// Some complex selectors might not be supported
				continue;
			}
		}

		// Try to find a pagination element and click the next number
		const paginationElements = [
			'.pagination',
			'.pager',
			'.pages',
			'nav[role="navigation"]',
			'ul.page-numbers',
		];

		for (const paginationSelector of paginationElements) {
			const pagination = document.querySelector(paginationSelector);
			if (pagination) {
				// Find the active/current page
				const currentPageElement = pagination.querySelector(
					'.active, .current, [aria-current="page"]',
				);
				if (currentPageElement) {
					// Try to find the next sibling that's a link
					let nextElement = currentPageElement.nextElementSibling;
					while (nextElement) {
						if (nextElement.tagName === 'A' || nextElement.querySelector('a')) {
							const link =
								nextElement.tagName === 'A'
									? (nextElement as HTMLElement)
									: (nextElement.querySelector('a') as HTMLElement);
							if (link) {
								link.click();
								return true;
							}
						}
						nextElement = nextElement.nextElementSibling;
					}
				}
			}
		}

		return false;
	});
}

// Enhance the clickAngularNextPage function
async function clickAngularNextPage(page: playwright.Page): Promise<boolean> {
	try {
		// Log all clickable elements for debugging
		await page.evaluate(() => {
			console.log('Potential Angular pagination elements:');
			document.querySelectorAll('button, a, [role="button"]').forEach(el => {
				if (
					el.textContent?.includes('Next') ||
					el.getAttribute('aria-label')?.includes('Next')
				) {
					console.log(el.outerHTML);
				}
			});
		});

		// Try to find and click any visible next button with common Angular patterns
		const clicked = await page.evaluate(() => {
			// More comprehensive selector for Angular pagination
			const nextButtons = document.querySelectorAll(
				'button.mat-paginator-navigation-next, .mat-mdc-paginator-navigation-next, ' +
					'[aria-label*="Next"], [aria-label*="next"], button:has(.mat-paginator-icon), ' +
					'a[href*="page="], .pagination a[rel="next"], a.next, button:has(span:contains("Next"))',
			);

			for (const btn of Array.from(nextButtons)) {
				const button = btn as HTMLElement;
				const isDisabled =
					button.hasAttribute('disabled') ||
					button.classList.contains('mat-button-disabled') ||
					button.getAttribute('aria-disabled') === 'true';

				if (!isDisabled && button.offsetParent !== null) {
					button.click();
					return true;
				}
			}
			return false;
		});

		if (clicked) {
			// Wait longer for Angular to update the DOM
			await page.waitForTimeout(2000);
			// Wait for network activity to settle
			await page.waitForLoadState('networkidle');
			return true;
		}

		return false;
	} catch (error) {
		logger.warn('Error clicking Angular next button', error);
		return false;
	}
}

async function clickLoadMoreButton(page: playwright.Page): Promise<boolean> {
	try {
		const loadMoreSelectors = [
			'button:text("Load More")',
			'a:text("Load More")',
			'button:text("Show More")',
			'a:text("Show More")',
			'.load-more-button',
			'.show-more',
			'.load-more-button',
			'.show-more-button',
			'[data-load-more]',
			'.read-more-button',
			'button:text("View More")',
			'a:text("View More")',
		];

		for (const selector of loadMoreSelectors) {
			const buttonExists = await page.$(selector);
			if (buttonExists) {
				await page.click(selector);
				await page.waitForTimeout(2000);
				return true;
			}
		}

		return await page.evaluate(() => {
			const loadMoreTextPatterns = [
				'load more',
				'show more',
				'view more',
				'see more',
				'more results',
				'more items',
				'read more',
				'continue reading',
			];

			const allButtons = Array.from(
				document.querySelectorAll('button, a, .button, [role="button"]'),
			);

			for (const button of allButtons) {
				const buttonText = button.textContent?.toLowerCase() || '';

				if (
					loadMoreTextPatterns.some(pattern => buttonText.includes(pattern))
				) {
					const style = window.getComputedStyle(button);
					if (
						style.display !== 'none' &&
						style.visibility !== 'hidden' &&
						style.opacity !== '0'
					) {
						(button as HTMLElement).click();
						return true;
					}
				}
			}

			return false;
		});
	} catch (error) {
		logger.warn('Error clicking load more button', error);
		return false;
	}
}

async function autoScroll(page: playwright.Page): Promise<void> {
	const scrollLogger = new Logger('AutoScroll');

	scrollLogger.debug('Starting auto-scroll process');

	await page.evaluate(async () => {
		await new Promise<void>(resolve => {
			let totalHeight = 0;
			const distance = 100;
			let lastHeight = document.body.scrollHeight;
			let unchangedCount = 0;

			const timer = setInterval(() => {
				const scrollHeight = document.body.scrollHeight;
				window.scrollBy(0, distance);
				totalHeight += distance;

				if (scrollHeight === lastHeight) {
					unchangedCount++;
				} else {
					unchangedCount = 0;
					lastHeight = scrollHeight;
				}

				if (totalHeight >= scrollHeight || unchangedCount > 10) {
					clearInterval(timer);
					resolve();
				}
			}, 100);
		});
	});

	scrollLogger.debug('Waiting after scroll to ensure content loads');
	await page.waitForTimeout(2000);
	scrollLogger.success('Auto-scroll completed successfully');
}
