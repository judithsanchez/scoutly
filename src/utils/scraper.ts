import playwright from 'playwright';
import * as cheerio from 'cheerio';
import type {Element} from 'domhandler';
import {Logger} from './logger';
import type {ICompany} from '../models/Company';

const logger = new Logger('Scraper');

// Semaphore for limiting concurrent browser instances
let activeBrowsers = 0;
const MAX_BROWSERS = 3;
const activeInstances = new Set<playwright.Browser>();

// Ensure cleanup on process exit
async function cleanupBrowsers(signal: string) {
	await logger.info(`Received ${signal}, cleaning up browsers...`);
	await Promise.all(
		Array.from(activeInstances).map(browser => {
			return browser
				.close()
				.catch(e =>
					logger.error('Error closing browser:', e).catch(console.error),
				);
		}),
	);
	process.exit(0);
}

process.on('SIGINT', () => cleanupBrowsers('SIGINT'));
process.on('SIGTERM', () => cleanupBrowsers('SIGTERM'));

async function acquireBrowser(): Promise<void> {
	while (activeBrowsers >= MAX_BROWSERS) {
		await logger.debug(
			`Waiting for browser slot (${activeBrowsers}/${MAX_BROWSERS} active)...`,
		);
		await new Promise(resolve => setTimeout(resolve, 1000));
	}
	activeBrowsers++;
	await logger.debug(
		`Browser slot acquired (${activeBrowsers}/${MAX_BROWSERS} active)`,
	);
}

function releaseBrowser(): void {
	activeBrowsers--;
	logger
		.debug(`Browser slot released (${activeBrowsers}/${MAX_BROWSERS} active)`)
		.catch(console.error);
}

export interface ScrapeRequest {
	url: string;
	options?: {
		timeout?: number;
		waitUntil?: 'domcontentloaded' | 'load' | 'networkidle';
	};
}

const DEFAULT_TIMEOUT = 60000; // 60s
const EXTENDED_TIMEOUT = 120000; // 120s
const MAX_LOAD_TIME = 300000; // 5m absolute maximum
const WAIT_STRATEGIES = ['networkidle', 'load', 'domcontentloaded'] as const;

// Retry configuration
const MAX_RETRIES = 5;
const MIN_RETRY_DELAY = 2000; // Start with 2s delay
const MAX_RETRY_DELAY = 30000; // Max 30s delay

export interface ExtractedLink {
	url: string;
	text: string;
	title?: string;
	context: string;
	isExternal: boolean;
}

export interface ScrapeResult {
	content: string;
	links: ExtractedLink[];
	error?: string;
	metadata?: {
		title?: string;
		description?: string;
		url: string;
		scrapedAt: string;
	};
}

function getFullUrl(href: string, baseUrl: string): string {
	try {
		if (href.startsWith('//')) {
			href = new URL(baseUrl).protocol + href;
		}
		return new URL(href, baseUrl).toString();
	} catch {
		return '';
	}
}

function isExternalUrl(url: string, baseUrl: string): boolean {
	try {
		return new URL(url).hostname !== new URL(baseUrl).hostname;
	} catch {
		return false;
	}
}

function cleanText(text: string): string {
	return text.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim();
}

function extractContext(
	$: cheerio.CheerioAPI,
	$elem: cheerio.Cheerio<Element>,
): string {
	const MAX_LENGTH = 100;
	let context = '';
	const linkText = $elem.text().trim();
	let prevText = '';
	$elem
		.prevAll()
		.slice(0, 3)
		.each((i: number, elem: Element) => {
			if (prevText.length < MAX_LENGTH) {
				const text = cleanText($(elem).text());
				if (text) {
					prevText = text + ' ' + prevText;
				}
			}
		});

	let nextText = '';
	$elem
		.nextAll()
		.slice(0, 3)
		.each((i: number, elem: Element) => {
			if (nextText.length < MAX_LENGTH) {
				const text = cleanText($(elem).text());
				if (text) {
					nextText = nextText + ' ' + text;
				}
			}
		});
	context = (prevText + ' ' + linkText + ' ' + nextText).trim();

	if (context.length < 20 && $elem.parent().length) {
		context = cleanText($elem.parent().text());
	}
	context = context
		.replace(new RegExp(linkText, 'g'), '')
		.replace(/\s+/g, ' ')
		.trim();

	if (context.length > MAX_LENGTH * 2) {
		context = context.substring(0, MAX_LENGTH * 2) + '...';
	}
	return context;
}

function extractLinks($: cheerio.CheerioAPI, baseUrl: string): ExtractedLink[] {
	const links: ExtractedLink[] = [];
	$('a[href]').each((_, elem) => {
		const $link = $(elem);
		const href = $link.attr('href');
		if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
			const fullUrl = getFullUrl(href, baseUrl);
			if (fullUrl) {
				const linkText = $link.text().trim();
				if (linkText) {
					links.push({
						url: fullUrl,
						text: linkText,
						title: $link.attr('title'),
						context: extractContext($, $link) || '',
						isExternal: isExternalUrl(fullUrl, baseUrl),
					});
				}
			}
		}
	});
	return links;
}

async function autoScroll(page: playwright.Page) {
	await page.evaluate(async () => {
		await new Promise<void>(resolve => {
			let totalHeight = 0;
			const distance = 100;
			let scrolls = 0;
			const timer = setInterval(() => {
				const scrollHeight = document.body.scrollHeight;
				window.scrollBy(0, distance);
				totalHeight += distance;
				scrolls++;
				if (totalHeight >= scrollHeight || scrolls >= 30) {
					// Add max scrolls
					clearInterval(timer);
					resolve();
				}
			}, 100);
		});
	});
}

export async function scrapeWebsite(
	request: ScrapeRequest,
	company?: ICompany,
): Promise<ScrapeResult> {
	const {url} = request;
	await logger.info(`Starting scrape operation for URL: ${url}`, {url});

	const browserOptions = {
		headless: true,
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-dev-shm-usage',
			'--disable-blink-features=AutomationControlled',
			'--disable-infobars',
		],
		executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
	};

	// Try to reuse browser for batch operations
	await acquireBrowser();
	let browser;
	let retries = 0;
	let lastError: Error | null = null;

	while (retries < MAX_RETRIES) {
		try {
			browser = await playwright.chromium.launch(browserOptions);
			activeInstances.add(browser);
			await logger.debug('Browser launched successfully');

			const context = await browser.newContext({
				userAgent:
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
				viewport: {width: 1920, height: 1080},
				deviceScaleFactor: 1,
				hasTouch: false,
				isMobile: false,
				javaScriptEnabled: true,
			});

			await context.addInitScript(() => {
				Object.defineProperty(navigator, 'webdriver', {get: () => false});
			});

			const page = await context.newPage();
			await page.mouse.move(Math.random() * 500, Math.random() * 500);

			await logger.info('Navigating to page...', {url});

			const timeout = request.options?.timeout || DEFAULT_TIMEOUT;
			const preferredWaitUntil = request.options?.waitUntil;
			let loaded = false;
			let lastError;

			const strategies = preferredWaitUntil
				? [
						preferredWaitUntil,
						...WAIT_STRATEGIES.filter(s => s !== preferredWaitUntil),
				  ]
				: WAIT_STRATEGIES;

			// Try each strategy with increasing timeouts
			for (const strategy of strategies) {
				const startTime = Date.now();
				try {
					const currentTimeout =
						strategy === 'networkidle' ? EXTENDED_TIMEOUT : timeout;

					await logger.debug(
						`Attempting to load page with strategy: '${strategy}'...`,
						{strategy, timeout: `${currentTimeout / 1000}s`},
					);

					// Set a hard timeout limit
					const loadPromise = page.goto(url, {
						waitUntil: strategy,
						timeout: currentTimeout,
					});
					const timeoutPromise = new Promise((_, reject) => {
						setTimeout(
							() => reject(new Error('Max load time exceeded')),
							MAX_LOAD_TIME,
						);
					});

					await Promise.race([loadPromise, timeoutPromise]);

					// Additional validation - check if content is actually present
					const hasContent = await page.evaluate(() => {
						const body = document.body;
						return body && body.innerHTML.length > 0;
					});

					if (!hasContent) {
						throw new Error('Page loaded but no content found');
					}

					// Wait a bit more for dynamic content
					await page.waitForTimeout(1000);

					loaded = true;
					const loadTime = (Date.now() - startTime) / 1000;
					await logger.success(
						`Page loaded successfully with '${strategy}' strategy`,
						{loadTime: `${loadTime.toFixed(1)}s`},
					);
					break;
				} catch (error: any) {
					lastError = error;
					const elapsed = (Date.now() - startTime) / 1000;
					await logger.warn(
						`Failed to load with '${strategy}' strategy: ${
							error.message.split('\n')[0]
						}`,
						{
							strategy,
							error: error.message,
							elapsed: `${elapsed.toFixed(1)}s`,
						},
					);
					// Wait before trying next strategy
					await page.waitForTimeout(2000);
				}
			}

			if (!loaded) {
				throw (
					lastError ||
					new Error('Failed to load page with all available strategies')
				);
			}

			await logger.info('Scrolling page to load lazy content...');
			await autoScroll(page);
			await page.waitForTimeout(1000); // Wait a final moment for anything to settle
			await logger.success('Scrolling complete.');

			const pageContent = await page.content();
			await logger.success('Content successfully scraped');
			const $ = cheerio.load(pageContent);

			const metadata = {
				title: $('title').text().trim() || $('h1').first().text().trim(),
				description:
					$('meta[name="description"]').attr('content')?.trim() ||
					$('meta[property="og:description"]').attr('content')?.trim(),
				url: url,
				scrapedAt: new Date().toISOString(),
			};

			const links = extractLinks($, url);
			await logger.info(`Extracted ${links.length} links from the page.`);

			const content = $('body').html() || '';

			return {
				content,
				links,
				metadata,
			};
		} catch (error: any) {
			const errorMsg = error.message || 'Unknown error during scraping';
			await logger.error('Scraping error:', {
				error: errorMsg,
				url,
				attempt: retries + 1,
			});

			// Record error if company is provided
			if (company) {
				// Error handling would go here - removed ScrapeErrorService reference
			}

			retries++;
			if (retries < MAX_RETRIES) {
				const delay = Math.min(
					MIN_RETRY_DELAY * Math.pow(2, retries),
					MAX_RETRY_DELAY,
				);

				await logger.info(
					`Retrying scrape (attempt ${retries + 1}/${MAX_RETRIES})...`,
					{
						delay: `${Math.round(delay / 1000)}s`,
						error: errorMsg,
						url,
					},
				);

				await new Promise(resolve => setTimeout(resolve, delay));
				continue;
			}
			return {
				content: '',
				links: [],
				error: errorMsg,
				metadata: {
					url,
					scrapedAt: new Date().toISOString(),
				},
			};
		} finally {
			if (company) {
				try {
					// Record successful scrape if no error occurred
					if (!lastError) {
						// Success handling would go here - removed ScrapeErrorService reference
					}
				} catch (err) {
					await logger
						.error('Failed to update scrape status:', err)
						.catch(console.error);
				}
			}
			if (browser) {
				try {
					await browser.close();
					activeInstances.delete(browser);
					await logger.debug('Browser closed successfully');
				} catch (error) {
					await logger
						.error('Error closing browser:', error)
						.catch(console.error);
				} finally {
					releaseBrowser();
				}
			}
		}
		break; // Exit retry loop on success
	}

	// If all retries failed, return error
	return {
		content: '',
		links: [],
		error: 'Max retries exceeded - failed to scrape page',
		metadata: {
			url,
			scrapedAt: new Date().toISOString(),
		},
	};
}
