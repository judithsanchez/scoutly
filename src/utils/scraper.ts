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

		// Scroll to the bottom of the page gradually to load lazy-loaded content
		logger.info('Starting auto-scroll to load lazy content');
		await autoScroll(page);
		logger.success('Auto-scroll completed');

		// Initialize the result object
		const result: ScrapeResult = {content: ''};

		// Extract metadata if requested
		if (options.includeMetadata) {
			logger.debug('Extracting metadata');
			result.metadata = await extractMetadata(page);
		}

		// Extract the content based on options
		if (options.selector) {
			logger.debug(`Extracting content with selector: ${options.selector}`);
			if (options.textOnly) {
				result.content = await extractTextContentWithSelector(
					page,
					options.selector,
				);
			} else if (options.cleanHtml) {
				result.content = await extractCleanHtmlWithSelector(
					page,
					options.selector,
				);
			} else {
				result.content = await extractHtmlWithSelector(page, options.selector);
			}
		} else if (options.autoDetectContent) {
			logger.debug('Auto-detecting and extracting main content');
			if (options.textOnly) {
				result.content = await extractAutoDetectedTextContent(page);
			} else {
				result.content = await extractAutoDetectedHtml(
					page,
					options.cleanHtml === true,
				);
			}
		} else if (options.textOnly) {
			logger.debug('Extracting text content only');
			result.content = await extractTextContent(page);
		} else if (options.cleanHtml) {
			logger.debug('Extracting clean HTML content');
			result.content = await extractCleanHtml(page);
		} else {
			// Default: extract body HTML
			logger.debug('Extracting body HTML content');
			result.content = await page.evaluate(() => {
				return document.body.innerHTML;
			});
		}

		// Log content size
		logger.info(`Extracted content size: ${result.content.length} characters`);

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
	await page.waitForTimeout(1000);
	scrollLogger.success('Auto-scroll completed successfully');
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
