import playwright from 'playwright';
import {Logger} from '@/utils/logger';

// Create a logger for the scraper
const logger = new Logger('Scraper');

/**
 * Options for the scraper
 */
export interface ScrapeOptions {
	/** Whether to clean the HTML (remove scripts, styles, etc.) */
	cleanHtml?: boolean;
	/** Whether to extract text only (no HTML) */
	textOnly?: boolean;
	/** Whether to include metadata (title, description, etc.) */
	includeMetadata?: boolean;
	/** CSS selector to target specific elements */
	selector?: string;
	/** Whether to automatically detect and extract main content */
	autoDetectContent?: boolean;
}

/**
 * Result from scraping a website
 */
export interface ScrapeResult {
	/** The scraped content */
	content: string;
	/** Any error that occurred */
	error?: string;
	/** Metadata from the page (if requested) */
	metadata?: {
		title?: string;
		description?: string;
		ogImage?: string;
		url?: string;
	};
	/** Pagination information */
	pagination?: {
		pagesScraped: number;
		infiniteScrollCycles: number;
	};
}

/**
 * Scrapes a website using Playwright, scrolls to the end, and returns the content.
 * Includes measures to bypass common scraping protections.
 *
 * @param url The URL of the website to scrape
 * @param options Options to customize the scraping behavior
 * @returns The scraped content and optional metadata
 */
export async function scrapeWebsite(
	url: string,
	options: ScrapeOptions = {},
): Promise<ScrapeResult> {
	let browser = null;

	logger.info(`Starting to scrape website: ${url}`);

	try {
		// Launch a browser
		logger.debug('Launching browser');
		browser = await playwright.chromium.launch({
			headless: true, // Run in headless mode
		});

		// Create a new context with a realistic user agent
		logger.debug('Creating browser context');
		const context = await browser.newContext({
			userAgent:
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
			viewport: {width: 1280, height: 800},
		});

		// Create a new page
		logger.debug('Creating new page');
		const page = await context.newPage();

		// Set extra HTTP headers to appear more like a real browser
		logger.debug('Setting HTTP headers');
		await page.setExtraHTTPHeaders({
			'Accept-Language': 'en-US,en;q=0.9',
			Referer: 'https://www.google.com/',
			DNT: '1',
		});

		// Navigate to the URL
		logger.info(`Navigating to ${url}`);
		await page.goto(url, {waitUntil: 'networkidle'});
		logger.success('Page loaded successfully');

		// Initialize the result object
		const result: ScrapeResult = {
			content: '',
			pagination: {
				pagesScraped: 1, // Start with 1 for the initial page
				infiniteScrollCycles: 0,
			},
		};

		// Extract metadata if requested (only from the first page)
		if (options.includeMetadata) {
			logger.debug('Extracting metadata');
			result.metadata = await extractMetadata(page);
		}

		// Perform initial scroll to load any lazy content
		logger.info('Performing initial scroll to load lazy content');
		await autoScroll(page);

		// Determine if the page has pagination or infinite scroll
		const paginationType = await detectPaginationType(page);
		logger.info(`Pagination type detected: ${paginationType}`);

		// Collect content from all pages
		let allContent: string[] = [];

		// Process the first page
		const firstPageContent = await extractContentBasedOnOptions(page, options);
		allContent.push(firstPageContent);

		// Handle different pagination types
		if (paginationType === 'standard' || paginationType === 'angular') {
			logger.info(`Processing ${paginationType} pagination`);
			const maxPages = 5; // Maximum number of pages to scrape
			let currentPage = 1;

			while (currentPage < maxPages) {
				// Try to click the next page button based on pagination type
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

				// Wait for the page to load
				await page.waitForLoadState('networkidle');

				// Additional wait for Angular sites
				if (paginationType === 'angular') {
					await page.waitForTimeout(1000); // Give Angular time to render
				}

				currentPage++;
				result.pagination!.pagesScraped = currentPage;
				logger.info(`Navigated to page ${currentPage}`);

				// Extract content from this page
				const pageContent = await extractContentBasedOnOptions(page, options);
				allContent.push(pageContent);
			}
		}
		// Handle infinite scroll
		else if (paginationType === 'infinite') {
			logger.info('Processing infinite scroll');
			const maxScrollCycles = 3; // Maximum number of scroll cycles
			let scrollCycles = 0;

			while (scrollCycles < maxScrollCycles) {
				// Get current content length to check if more content is loaded
				const currentContentLength = await page.evaluate(
					() => document.body.innerHTML.length,
				);

				// Check for "Load More" buttons and click them if present
				const loadMoreClicked = await clickLoadMoreButton(page);

				if (!loadMoreClicked) {
					// If no load more button, perform auto-scroll
					await autoScroll(page);
				}

				scrollCycles++;
				result.pagination!.infiniteScrollCycles = scrollCycles;
				logger.info(`Completed scroll/load more cycle ${scrollCycles}`);

				// Wait for content to load
				await page.waitForTimeout(2000);

				// Check if new content was loaded
				const newContentLength = await page.evaluate(
					() => document.body.innerHTML.length,
				);
				if (newContentLength <= currentContentLength * 1.05) {
					// Less than 5% increase in content
					logger.info(
						'No significant new content loaded after scrolling/loading more',
					);
					break;
				}

				// Extract content after scrolling if this is the last cycle or no new content
				if (
					scrollCycles === maxScrollCycles ||
					newContentLength <= currentContentLength * 1.05
				) {
					const scrollContent = await extractContentBasedOnOptions(
						page,
						options,
					);
					allContent = [scrollContent]; // Replace with the final content that includes everything
				}
			}
		}
		// If no pagination detected, just use the content from the first page
		else {
			logger.info('No pagination detected');
			// We already have the first page content in allContent
		}

		// Combine all content
		result.content = allContent.join('\n\n');

		// Log content size
		logger.info(
			`Extracted content size: ${result.content.length} characters from ${
				result.pagination!.pagesScraped
			} pages`,
		);

		// Close the browser
		logger.debug('Closing browser');
		await browser.close();
		browser = null;

		logger.success(`Successfully scraped website: ${url}`);
		return result;
	} catch (error) {
		logger.error('Error scraping website', error);
		return {
			content: '',
			error: `Error scraping website: ${
				error instanceof Error ? error.message : String(error)
			}`,
			pagination: {
				pagesScraped: 0,
				infiniteScrollCycles: 0,
			},
		};
	} finally {
		// Ensure browser is closed even if an error occurs
		if (browser) {
			logger.debug('Closing browser in finally block');
			await browser.close();
		}
	}
}

/**
 * Detects the type of pagination on the page
 * @param page Playwright page object
 * @returns The type of pagination: 'standard', 'angular', 'infinite', or 'none'
 */
async function detectPaginationType(page: playwright.Page): Promise<string> {
	return await page.evaluate(() => {
		// Check for Angular Material paginator
		const hasAngularPaginator = !!document.querySelector(
			'mat-paginator, .mat-paginator',
		);
		if (hasAngularPaginator) return 'angular';

		// Check for standard pagination
		const standardPaginationSelectors = [
			'.pagination',
			'.pager',
			'.pages',
			'nav[role="navigation"]',
			'ul.page-numbers',
			'.page-navigation',
			'.page-links',
			'.wp-pagenavi',
			// Add more common pagination selectors
		];

		for (const selector of standardPaginationSelectors) {
			if (document.querySelector(selector)) return 'standard';
		}

		// Check for next page links
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
			// Add more next page selectors
		];

		for (const selector of nextPageSelectors) {
			try {
				if (document.querySelector(selector)) return 'standard';
			} catch (e) {
				// Some complex selectors might not be supported
				continue;
			}
		}

		// Check for infinite scroll indicators
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
			// Add more infinite scroll indicators
		];

		for (const selector of infiniteScrollIndicators) {
			try {
				if (document.querySelector(selector)) return 'infinite';
			} catch (e) {
				// Some complex selectors might not be supported
				continue;
			}
		}

		// Check for common infinite scroll libraries
		const infiniteScrollLibraries = [
			'infinite-scroll',
			'infScroll',
			'ias', // Infinite Ajax Scroll
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

/**
 * Clicks the next page button for standard pagination
 * @param page Playwright page object
 */
async function clickStandardNextPage(page: playwright.Page): Promise<boolean> {
	return await page.evaluate(() => {
		// Common next page selectors in order of preference
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
			// Add more selectors as needed
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

/**
 * Clicks the next page button for Angular Material paginator
 * @param page Playwright page object
 */
async function clickAngularNextPage(page: playwright.Page): Promise<boolean> {
	// First try to click the next button directly
	try {
		// Look for the next button in Angular Material paginator
		const nextButtonSelector =
			'button.mat-paginator-navigation-next:not([disabled]), .mat-paginator-navigation-next:not(.mat-button-disabled)';
		const nextButtonExists = await page.$(nextButtonSelector);

		if (nextButtonExists) {
			await page.click(nextButtonSelector);
			await page.waitForTimeout(1000); // Wait for Angular to update
			return true;
		}
	} catch (error) {
		logger.warn('Error clicking Angular next button', error);
	}

	// If direct click fails, try using evaluate
	return await page.evaluate(() => {
		// Try to find and click the next button in Angular Material paginator
		const nextButton = document.querySelector(
			'button.mat-paginator-navigation-next:not([disabled]), .mat-paginator-navigation-next:not(.mat-button-disabled)',
		) as HTMLElement;

		if (nextButton) {
			nextButton.click();
			return true;
		}

		// Try to find and click page number buttons
		const pageButtons = document.querySelectorAll(
			'.mat-paginator-page-number, .mat-paginator-range-actions button',
		);
		let currentPageFound = false;

		for (let i = 0; i < pageButtons.length; i++) {
			const button = pageButtons[i] as HTMLElement;

			// If this is a selected/active button, mark that we foun
			// If this is a selected/active button, mark that we found the current page
			if (
				button.classList.contains('mat-button-disabled') ||
				button.classList.contains('active') ||
				button.getAttribute('aria-current') === 'true'
			) {
				currentPageFound = true;
				continue;
			}

			// If we already found the current page, this must be the next page
			if (currentPageFound) {
				button.click();
				return true;
			}
		}

		// If we couldn't find the next button or page, try clicking on the page size selector
		// and selecting a different option to trigger a page change
		const pageSizeSelect = document.querySelector(
			'.mat-paginator-page-size-select',
		) as HTMLElement;
		if (pageSizeSelect) {
			pageSizeSelect.click();

			// Wait a bit for the dropdown to open
			setTimeout(() => {
				// Try to click a different page size option
				const pageSizeOptions = document.querySelectorAll('.mat-option');
				if (pageSizeOptions.length > 1) {
					// Click the second option (different from current)
					(pageSizeOptions[1] as HTMLElement).click();
					return true;
				}
			}, 500);
		}

		return false;
	});
}

/**
 * Tries to click a "Load More" button if present
 * @param page Playwright page object
 */
async function clickLoadMoreButton(page: playwright.Page): Promise<boolean> {
	try {
		// Common load more button selectors
		const loadMoreSelectors = [
			'button:text("Load More")',
			'a:text("Load More")',
			'button:text("Show More")',
			'a:text("Show More")',
			'.load-more-button',
			'.show-more-button',
			'[data-load-more]',
			'.read-more-button',
			'button:text("View More")',
			'a:text("View More")',
			// Add more selectors as needed
		];

		for (const selector of loadMoreSelectors) {
			const buttonExists = await page.$(selector);
			if (buttonExists) {
				await page.click(selector);
				await page.waitForTimeout(2000); // Wait for content to load
				return true;
			}
		}

		// If direct selectors fail, try using evaluate for more complex detection
		return await page.evaluate(() => {
			// Common text patterns for load more buttons
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

			// Find buttons or links containing these texts
			const allButtons = Array.from(
				document.querySelectorAll('button, a, .button, [role="button"]'),
			);

			for (const button of allButtons) {
				const buttonText = button.textContent?.toLowerCase() || '';

				// Check if the button text matches any of our patterns
				if (
					loadMoreTextPatterns.some(pattern => buttonText.includes(pattern))
				) {
					// Make sure the button is visible
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

/**
 * Auto-scrolls a page to the bottom to load lazy-loaded content
 * @param page Playwright page object
 */
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

				// Check if we've made progress in scrolling
				if (scrollHeight === lastHeight) {
					unchangedCount++;
				} else {
					unchangedCount = 0;
					lastHeight = scrollHeight;
				}

				// If we've scrolled past the document height or haven't made progress in scrolling
				if (totalHeight >= scrollHeight || unchangedCount > 10) {
					clearInterval(timer);
					resolve();
				}
			}, 100);
		});
	});

	scrollLogger.debug('Waiting after scroll to ensure content loads');
	await page.waitForTimeout(2000); // Increased wait time to ensure content loads
	scrollLogger.success('Auto-scroll completed successfully');
}

/**
 * Extracts content based on the provided options
 * @param page Playwright page object
 * @param options Scrape options
 */
async function extractContentBasedOnOptions(
	page: playwright.Page,
	options: ScrapeOptions,
): Promise<string> {
	if (options.selector) {
		if (options.textOnly) {
			return await extractTextContentWithSelector(page, options.selector);
		} else if (options.cleanHtml) {
			return await extractCleanHtmlWithSelector(page, options.selector);
		} else {
			return await extractHtmlWithSelector(page, options.selector);
		}
	} else if (options.autoDetectContent) {
		if (options.textOnly) {
			return await extractAutoDetectedTextContent(page);
		} else {
			return await extractAutoDetectedHtml(page, options.cleanHtml === true);
		}
	} else if (options.textOnly) {
		return await extractTextContent(page);
	} else if (options.cleanHtml) {
		return await extractCleanHtml(page);
	} else {
		// Default: extract body HTML
		return await page.evaluate(() => {
			return document.body.innerHTML;
		});
	}
}

/**
 * Extracts metadata from the page
 * @param page Playwright page object
 */
async function extractMetadata(
	page: playwright.Page,
): Promise<ScrapeResult['metadata']> {
	return await page.evaluate(() => {
		const metadata: ScrapeResult['metadata'] = {};

		// Extract title
		const titleElement = document.querySelector('title');
		if (titleElement) metadata.title = titleElement.textContent || undefined;

		// Extract description
		const descElement = document.querySelector('meta[name="description"]');
		if (descElement)
			metadata.description = descElement.getAttribute('content') || undefined;

		// Extract Open Graph image
		const ogImageElement = document.querySelector('meta[property="og:image"]');
		if (ogImageElement)
			metadata.ogImage = ogImageElement.getAttribute('content') || undefined;

		// Include the URL
		metadata.url = window.location.href;

		return metadata;
	});
}

/**
 * Extracts text content from the page (no HTML)
 * @param page Playwright page object
 */
async function extractTextContent(page: playwright.Page): Promise<string> {
	return await page.evaluate(() => {
		return document.body.textContent || '';
	});
}

/**
 * Extracts clean HTML content (removes scripts, styles, etc.)
 * @param page Playwright page object
 */
async function extractCleanHtml(page: playwright.Page): Promise<string> {
	return await page.evaluate(() => {
		// Clone the body to avoid modifying the actual page
		const clone = document.body.cloneNode(true) as HTMLElement;

		// Remove scripts, styles, and other non-content elements
		const elementsToRemove = clone.querySelectorAll(
			'script, style, iframe, noscript, svg, [style*="display:none"], [style*="display: none"]',
		);
		elementsToRemove.forEach(el => el.remove());

		// Remove event handlers and inline styles
		const allElements = clone.querySelectorAll('*');
		allElements.forEach(el => {
			// Remove all attributes except for a few essential ones
			const attributes = Array.from(el.attributes);
			attributes.forEach(attr => {
				if (!['href', 'src', 'alt', 'title', 'class'].includes(attr.name)) {
					el.removeAttribute(attr.name);
				}
			});
		});

		return clone.innerHTML;
	});
}

/**
 * Extracts HTML content from elements matching the selector
 * @param page Playwright page object
 * @param selector CSS selector to target specific elements
 */
async function extractHtmlWithSelector(
	page: playwright.Page,
	selector: string,
): Promise<string> {
	return await page.evaluate(sel => {
		const elements = document.querySelectorAll(sel);
		if (elements.length === 0) return '';

		// If multiple elements match, combine their HTML
		let result = '';
		elements.forEach(el => {
			result += el.outerHTML;
		});
		return result;
	}, selector);
}

/**
 * Extracts text content from elements matching the selector
 * @param page Playwright page object
 * @param selector CSS selector to target specific elements
 */
async function extractTextContentWithSelector(
	page: playwright.Page,
	selector: string,
): Promise<string> {
	return await page.evaluate(sel => {
		const elements = document.querySelectorAll(sel);
		if (elements.length === 0) return '';

		// If multiple elements match, combine their text content
		let result = '';
		elements.forEach(el => {
			result += (el.textContent || '') + '\n';
		});
		return result.trim();
	}, selector);
}

/**
 * Extracts clean HTML content from elements matching the selector
 * @param page Playwright page object
 * @param selector CSS selector to target specific elements
 */
async function extractCleanHtmlWithSelector(
	page: playwright.Page,
	selector: string,
): Promise<string> {
	return await page.evaluate(sel => {
		const elements = document.querySelectorAll(sel);
		if (elements.length === 0) return '';

		// If multiple elements match, combine their cleaned HTML
		let result = '';
		elements.forEach(el => {
			// Clone the element to avoid modifying the actual page
			const clone = el.cloneNode(true) as HTMLElement;

			// Remove scripts, styles, and other non-content elements
			const elementsToRemove = clone.querySelectorAll(
				'script, style, iframe, noscript, svg, [style*="display:none"], [style*="display: none"]',
			);
			elementsToRemove.forEach(el => el.remove());

			// Remove event handlers and inline styles
			const allElements = clone.querySelectorAll('*');
			allElements.forEach(el => {
				// Remove all attributes except for a few essential ones
				const attributes = Array.from(el.attributes);
				attributes.forEach(attr => {
					if (!['href', 'src', 'alt', 'title', 'class'].includes(attr.name)) {
						el.removeAttribute(attr.name);
					}
				});
			});

			result += clone.outerHTML;
		});
		return result;
	}, selector);
}

/**
 * Automatically detects and extracts the main content HTML from a page
 * Uses heuristics to identify the most content-rich area of the page
 *
 * @param page Playwright page object
 * @param clean Whether to clean the HTML (remove scripts, styles, etc.)
 */
async function extractAutoDetectedHtml(
	page: playwright.Page,
	clean: boolean = false,
): Promise<string> {
	return await page.evaluate(shouldClean => {
		// Common content container selectors
		const possibleContentSelectors = [
			'article',
			'main',
			'.content',
			'#content',
			'.main',
			'#main',
			'.post',
			'.article',
			'.post-content',
			'.entry-content',
			'[role="main"]',
			'.main-content',
			'.page-content',
		];

		// Try to find content using common selectors
		for (const selector of possibleContentSelectors) {
			const element = document.querySelector(selector);
			if (
				element &&
				element.textContent &&
				element.textContent.trim().length > 100
			) {
				// Found a good candidate
				if (!shouldClean) {
					return element.outerHTML;
				}

				// Clean the HTML if requested
				const clone = element.cloneNode(true) as HTMLElement;

				// Remove scripts, styles, and other non-content elements
				const elementsToRemove = clone.querySelectorAll(
					'script, style, iframe, noscript, svg, [style*="display:none"], [style*="display: none"]',
				);
				elementsToRemove.forEach(el => el.remove());

				// Remove event handlers and inline styles
				const allElements = clone.querySelectorAll('*');
				allElements.forEach(el => {
					// Remove all attributes except for a few essential ones
					const attributes = Array.from(el.attributes);
					attributes.forEach(attr => {
						if (!['href', 'src', 'alt', 'title', 'class'].includes(attr.name)) {
							el.removeAttribute(attr.name);
						}
					});
				});

				return clone.outerHTML;
			}
		}

		// If no common selectors found, use content density analysis
		// Find the element with the highest content-to-markup ratio
		const allElements = document.querySelectorAll('body *');
		let bestElement = document.body;
		let bestRatio = 0;
		let bestTextLength = 0;

		allElements.forEach(el => {
			// Skip tiny elements and hidden elements
			if (el.textContent && el.textContent.trim().length > 50) {
				const textLength = el.textContent.trim().length;
				const markupLength = el.outerHTML.length;
				const ratio = textLength / markupLength;

				// Prioritize elements with more text and better ratio
				if (textLength > bestTextLength * 0.8 && ratio > bestRatio * 0.8) {
					// Check if this element contains most of the text from the best element so far
					// This helps us move up the DOM tree to find container elements
					if (
						bestElement.textContent &&
						el.textContent.includes(bestElement.textContent.substring(0, 100))
					) {
						bestElement = el as HTMLElement;
						bestRatio = ratio;
						bestTextLength = textLength;
					}
				}
			}
		});

		// If we found a good element with content
		if (bestElement !== document.body && bestTextLength > 200) {
			if (!shouldClean) {
				return bestElement.outerHTML;
			}

			// Clean the HTML if requested
			const clone = bestElement.cloneNode(true) as HTMLElement;

			// Remove scripts, styles, and other non-content elements
			const elementsToRemove = clone.querySelectorAll(
				'script, style, iframe, noscript, svg, [style*="display:none"], [style*="display: none"]',
			);
			elementsToRemove.forEach(el => el.remove());

			// Remove event handlers and inline styles
			const allElements = clone.querySelectorAll('*');
			allElements.forEach(el => {
				// Remove all attributes except for a few essential ones
				const attributes = Array.from(el.attributes);
				attributes.forEach(attr => {
					if (!['href', 'src', 'alt', 'title', 'class'].includes(attr.name)) {
						el.removeAttribute(attr.name);
					}
				});
			});

			return clone.outerHTML;
		}

		// Fallback: return cleaned body if requested, or empty string
		if (shouldClean) {
			const clone = document.body.cloneNode(true) as HTMLElement;

			// Remove scripts, styles, and other non-content elements
			const elementsToRemove = clone.querySelectorAll(
				'script, style, iframe, noscript, svg, [style*="display:none"], [style*="display: none"]',
			);
			elementsToRemove.forEach(el => el.remove());

			// Remove event handlers and inline styles
			const allElements = clone.querySelectorAll('*');
			allElements.forEach(el => {
				// Remove all attributes except for a few essential ones
				const attributes = Array.from(el.attributes);
				attributes.forEach(attr => {
					if (!['href', 'src', 'alt', 'title', 'class'].includes(attr.name)) {
						el.removeAttribute(attr.name);
					}
				});
			});

			return clone.innerHTML;
		}

		return document.body.innerHTML;
	}, clean);
}

/**
 * Automatically detects and extracts the main content text from a page
 * Uses heuristics to identify the most content-rich area of the page
 *
 * @param page Playwright page object
 */
async function extractAutoDetectedTextContent(
	page: playwright.Page,
): Promise<string> {
	return await page.evaluate(() => {
		// Common content container selectors
		const possibleContentSelectors = [
			'article',
			'main',
			'.content',
			'#content',
			'.main',
			'#main',
			'.post',
			'.article',
			'.post-content',
			'.entry-content',
			'[role="main"]',
			'.main-content',
			'.page-content',
		];

		// Try to find content using common selectors
		for (const selector of possibleContentSelectors) {
			const element = document.querySelector(selector);
			if (
				element &&
				element.textContent &&
				element.textContent.trim().length > 100
			) {
				// Found a good candidate
				return element.textContent.trim();
			}
		}

		// If no common selectors found, use content density analysis
		// Find the element with the highest content-to-markup ratio
		const allElements = document.querySelectorAll('body *');
		let bestElement = document.body;
		let bestRatio = 0;
		let bestTextLength = 0;

		allElements.forEach(el => {
			// Skip tiny elements and hidden elements
			if (el.textContent && el.textContent.trim().length > 50) {
				const textLength = el.textContent.trim().length;
				const markupLength = el.outerHTML.length;
				const ratio = textLength / markupLength;

				// Prioritize elements with more text and better ratio
				if (textLength > bestTextLength * 0.8 && ratio > bestRatio * 0.8) {
					// Check if this element contains most of the text from the best element so far
					// This helps us move up the DOM tree to find container elements
					if (
						bestElement.textContent &&
						el.textContent.includes(bestElement.textContent.substring(0, 100))
					) {
						bestElement = el as HTMLElement;
						bestRatio = ratio;
						bestTextLength = textLength;
					}
				}
			}
		});

		// If we found a good element with content
		if (bestElement !== document.body && bestTextLength > 200) {
			return bestElement.textContent?.trim() || '';
		}

		// Fallback: return body text
		return document.body.textContent?.trim() || '';
	});
}
