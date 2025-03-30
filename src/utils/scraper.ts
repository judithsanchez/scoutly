import playwright from 'playwright';
import {Logger} from '@/utils/logger';

const logger = new Logger('Scraper');

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
	/** Whether to extract links along with text content */
	includeLinks?: boolean;
}
export interface ScrapeResult {
	content: string;
	error?: string;
	metadata?: {
		title?: string;
		description?: string;
		ogImage?: string;
		url?: string;
		characterCount?: number; // Add this new field
	};
	pagination?: {
		pagesScraped: number;
		infiniteScrollCycles: number;
	};
}

export async function scrapeWebsite(
	url: string,
	options: ScrapeOptions = {},
): Promise<ScrapeResult> {
	let browser = null;

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
			pagination: {
				pagesScraped: 1,
				infiniteScrollCycles: 0,
			},
		};

		if (options.includeMetadata) {
			logger.debug('Extracting metadata');
			result.metadata = await extractMetadata(page);
		}

		logger.info('Performing initial scroll to load lazy content');
		await autoScroll(page);

		const paginationType = await detectPaginationType(page);
		logger.info(`Pagination type detected: ${paginationType}`);

		let allContent: string[] = [];

		const firstPageContent = await extractContentBasedOnOptions(page, options);
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
				result.pagination!.pagesScraped = currentPage;
				logger.info(`Navigated to page ${currentPage}`);

				const pageContent = await extractContentBasedOnOptions(page, options);
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
				result.pagination!.infiniteScrollCycles = scrollCycles;
				logger.info(`Completed scroll/load more cycle ${scrollCycles}`);

				await page.waitForTimeout(2000);

				const newContentLength = await page.evaluate(
					() => document.body.innerHTML.length,
				);
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
					const scrollContent = await extractContentBasedOnOptions(
						page,
						options,
					);
					allContent = [scrollContent];
				}
			}
		} else {
			logger.info('No pagination detected');
		}

		result.content = allContent.join('\n\n');

		logger.info(
			`Extracted content size: ${result.content.length} characters from ${
				result.pagination!.pagesScraped
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
			pagination: {
				pagesScraped: 0,
				infiniteScrollCycles: 0,
			},
		};
	} finally {
		if (browser) {
			logger.debug('Closing browser in finally block');
			await browser.close();
		}
	}
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

async function clickAngularNextPage(page: playwright.Page): Promise<boolean> {
	try {
		const nextButtonSelector =
			'button.mat-paginator-navigation-next:not([disabled]), .mat-paginator-navigation-next:not(.mat-button-disabled)';
		const nextButtonExists = await page.$(nextButtonSelector);

		if (nextButtonExists) {
			await page.click(nextButtonSelector);
			await page.waitForTimeout(1000);
			return true;
		}
	} catch (error) {
		logger.warn('Error clicking Angular next button', error);
	}

	return await page.evaluate(() => {
		const nextButton = document.querySelector(
			'button.mat-paginator-navigation-next:not([disabled]), .mat-paginator-navigation-next:not(.mat-button-disabled)',
		) as HTMLElement;

		if (nextButton) {
			nextButton.click();
			return true;
		}

		const pageButtons = document.querySelectorAll(
			'.mat-paginator-page-number, .mat-paginator-range-actions button',
		);
		let currentPageFound = false;

		for (let i = 0; i < pageButtons.length; i++) {
			const button = pageButtons[i] as HTMLElement;

			if (
				button.classList.contains('mat-button-disabled') ||
				button.classList.contains('active') ||
				button.getAttribute('aria-current') === 'true'
			) {
				currentPageFound = true;
				continue;
			}

			if (currentPageFound) {
				button.click();
				return true;
			}
		}

		const pageSizeSelect = document.querySelector(
			'.mat-paginator-page-size-select',
		) as HTMLElement;
		if (pageSizeSelect) {
			pageSizeSelect.click();

			setTimeout(() => {
				const pageSizeOptions = document.querySelectorAll('.mat-option');
				if (pageSizeOptions.length > 1) {
					(pageSizeOptions[1] as HTMLElement).click();
					return true;
				}
			}, 500);
		}

		return false;
	});
}

async function clickLoadMoreButton(page: playwright.Page): Promise<boolean> {
	try {
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

async function extractContentBasedOnOptions(
	page: playwright.Page,
	options: ScrapeOptions,
): Promise<string> {
	if (options.selector) {
		if (options.textOnly) {
			return await extractTextContentWithSelector(
				page,
				options.selector,
				options.includeLinks === true,
			);
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
		return await page.evaluate(() => {
			return document.body.innerHTML;
		});
	}
}

async function extractMetadata(
	page: playwright.Page,
): Promise<ScrapeResult['metadata']> {
	return await page.evaluate(() => {
		const metadata: ScrapeResult['metadata'] = {};

		const titleElement = document.querySelector('title');
		if (titleElement) metadata.title = titleElement.textContent || undefined;

		const descElement = document.querySelector('meta[name="description"]');
		if (descElement)
			metadata.description = descElement.getAttribute('content') || undefined;

		const ogImageElement = document.querySelector('meta[property="og:image"]');
		if (ogImageElement)
			metadata.ogImage = ogImageElement.getAttribute('content') || undefined;

		metadata.url = window.location.href;

		return metadata;
	});
}

async function extractTextContent(page: playwright.Page): Promise<string> {
	return await page.evaluate(() => {
		return document.body.textContent || '';
	});
}

async function extractCleanHtml(page: playwright.Page): Promise<string> {
	return await page.evaluate(() => {
		const clone = document.body.cloneNode(true) as HTMLElement;

		const elementsToRemove = clone.querySelectorAll(
			'script, style, iframe, noscript, svg, [style*="display:none"], [style*="display: none"]',
		);
		elementsToRemove.forEach(el => el.remove());

		const allElements = clone.querySelectorAll('*');
		allElements.forEach(el => {
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

async function extractHtmlWithSelector(
	page: playwright.Page,
	selector: string,
): Promise<string> {
	return await page.evaluate(sel => {
		const elements = document.querySelectorAll(sel);
		if (elements.length === 0) return '';

		let result = '';
		elements.forEach(el => {
			result += el.outerHTML;
		});
		return result;
	}, selector);
}

async function extractTextContentWithSelector(
	page: playwright.Page,
	selector: string,
	includeLinks: boolean = false,
): Promise<string> {
	// Pass parameters as an array after the function
	return await page.evaluate(
		params => {
			const sel = params.selector;
			const extractLinks = params.includeLinks;

			const elements = document.querySelectorAll(sel);
			if (elements.length === 0) return '';

			let result = '';
			elements.forEach(el => {
				if (extractLinks) {
					// Extract text with links
					const links = el.querySelectorAll('a');
					const linkMap = new Map();

					// Collect all links first
					links.forEach(link => {
						const url = link.href;
						const text = link.textContent?.trim() || '';
						if (url && text) {
							linkMap.set(text, url);
						}
					});

					// Get the text content
					let textContent = (el.textContent || '').trim();

					// Append links at the end of each job listing
					if (linkMap.size > 0) {
						// Try to identify job listings by common patterns
						const jobTitles = el.querySelectorAll(
							'h2, h3, .job-title, [class*="title"]',
						);

						if (jobTitles.length > 0) {
							// If we can identify job titles, append links after each job section
							let processedText = textContent;
							jobTitles.forEach(title => {
								const titleText = title.textContent?.trim() || '';
								if (titleText && linkMap.has(titleText)) {
									const linkUrl = linkMap.get(titleText);
									processedText = processedText.replace(
										titleText,
										`${titleText} [URL: ${linkUrl}]`,
									);
								}
							});
							textContent = processedText;
						} else {
							// If we can't identify job titles, just append all links at the end
							textContent += '\n\nLinks:\n';
							linkMap.forEach((url, text) => {
								textContent += `${text}: ${url}\n`;
							});
						}
					}

					result += textContent + '\n\n';
				} else {
					// Original behavior
					result += (el.textContent || '') + '\n';
				}
			});
			return result.trim();
		},
		{selector, includeLinks}, // Pass parameters as a single object
	);
}

async function extractCleanHtmlWithSelector(
	page: playwright.Page,
	selector: string,
): Promise<string> {
	return await page.evaluate(sel => {
		const elements = document.querySelectorAll(sel);
		if (elements.length === 0) return '';

		let result = '';
		elements.forEach(el => {
			const clone = el.cloneNode(true) as HTMLElement;

			const elementsToRemove = clone.querySelectorAll(
				'script, style, iframe, noscript, svg, [style*="display:none"], [style*="display: none"]',
			);
			elementsToRemove.forEach(el => el.remove());

			const allElements = clone.querySelectorAll('*');
			allElements.forEach(el => {
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

async function extractAutoDetectedHtml(
	page: playwright.Page,
	clean: boolean = false,
): Promise<string> {
	return await page.evaluate(shouldClean => {
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

		for (const selector of possibleContentSelectors) {
			const element = document.querySelector(selector);
			if (
				element &&
				element.textContent &&
				element.textContent.trim().length > 100
			) {
				if (!shouldClean) {
					return element.outerHTML;
				}

				const clone = element.cloneNode(true) as HTMLElement;

				const elementsToRemove = clone.querySelectorAll(
					'script, style, iframe, noscript, svg, [style*="display:none"], [style*="display: none"]',
				);
				elementsToRemove.forEach(el => el.remove());

				const allElements = clone.querySelectorAll('*');
				allElements.forEach(el => {
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

		const allElements = document.querySelectorAll('body *');
		let bestElement = document.body;
		let bestRatio = 0;
		let bestTextLength = 0;

		allElements.forEach(el => {
			if (el.textContent && el.textContent.trim().length > 50) {
				const textLength = el.textContent.trim().length;
				const markupLength = el.outerHTML.length;
				const ratio = textLength / markupLength;

				if (textLength > bestTextLength * 0.8 && ratio > bestRatio * 0.8) {
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

		if (bestElement !== document.body && bestTextLength > 200) {
			if (!shouldClean) {
				return bestElement.outerHTML;
			}

			const clone = bestElement.cloneNode(true) as HTMLElement;

			const elementsToRemove = clone.querySelectorAll(
				'script, style, iframe, noscript, svg, [style*="display:none"], [style*="display: none"]',
			);
			elementsToRemove.forEach(el => el.remove());

			const allElements = clone.querySelectorAll('*');
			allElements.forEach(el => {
				const attributes = Array.from(el.attributes);
				attributes.forEach(attr => {
					if (!['href', 'src', 'alt', 'title', 'class'].includes(attr.name)) {
						el.removeAttribute(attr.name);
					}
				});
			});

			return clone.outerHTML;
		}

		if (shouldClean) {
			const clone = document.body.cloneNode(true) as HTMLElement;

			const elementsToRemove = clone.querySelectorAll(
				'script, style, iframe, noscript, svg, [style*="display:none"], [style*="display: none"]',
			);
			elementsToRemove.forEach(el => el.remove());

			const allElements = clone.querySelectorAll('*');
			allElements.forEach(el => {
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

async function extractAutoDetectedTextContent(
	page: playwright.Page,
): Promise<string> {
	return await page.evaluate(() => {
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

		for (const selector of possibleContentSelectors) {
			const element = document.querySelector(selector);
			if (
				element &&
				element.textContent &&
				element.textContent.trim().length > 100
			) {
				return element.textContent.trim();
			}
		}

		const allElements = document.querySelectorAll('body *');
		let bestElement = document.body;
		let bestRatio = 0;
		let bestTextLength = 0;

		allElements.forEach(el => {
			if (el.textContent && el.textContent.trim().length > 50) {
				const textLength = el.textContent.trim().length;
				const markupLength = el.outerHTML.length;
				const ratio = textLength / markupLength;

				if (textLength > bestTextLength * 0.8 && ratio > bestRatio * 0.8) {
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

		if (bestElement !== document.body && bestTextLength > 200) {
			return bestElement.textContent?.trim() || '';
		}

		return document.body.textContent?.trim() || '';
	});
}
