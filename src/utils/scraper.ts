import playwright from 'playwright';
import * as cheerio from 'cheerio';
import type {Element} from 'domhandler';
import {Logger} from '@/utils/logger';

const logger = new Logger('Scraper');

export interface ScrapeRequest {
	url: string;
	options?: {
		timeout?: number;
		waitUntil?: 'domcontentloaded' | 'load' | 'networkidle';
	};
}

const DEFAULT_TIMEOUT = 30000;
const EXTENDED_TIMEOUT = 60000;
const WAIT_STRATEGIES = ['domcontentloaded', 'load', 'networkidle'] as const;

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
		// Handle protocol-relative URLs
		if (href.startsWith('//')) {
			href = 'https:' + href;
		}
		const fullUrl = new URL(href, baseUrl);
		return fullUrl.toString();
	} catch {
		return ''; // Return empty string for invalid URLs
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
	const MAX_LENGTH = 100; // Maximum characters for context before/after
	let context = '';

	// Get the element's own text content
	const linkText = $elem.text().trim();

	// Get previous text nodes
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

	// Get next text nodes
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

	// Combine the context
	context = (prevText + ' ' + linkText + ' ' + nextText).trim();

	// If context is too short, try parent's text
	if (context.length < 20 && $elem.parent().length) {
		context = cleanText($elem.parent().text());
	}

	// Final cleanup and length limitation
	context = context
		.replace(new RegExp(linkText, 'g'), '') // Remove duplicate link text
		.replace(/\s+/g, ' ')
		.trim();

	// Ensure context isn't too long
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
				const context = extractContext($, $link);

				// Only add if we have meaningful content
				if (linkText) {
					links.push({
						url: fullUrl,
						text: linkText,
						title: $link.attr('title'),
						context: context || '',
						isExternal: isExternalUrl(fullUrl, baseUrl),
					});
				}
			}
		}
	});

	return links;
}

export async function scrapeWebsite(
	request: ScrapeRequest,
): Promise<ScrapeResult> {
	const {url} = request;
	logger.info(`Starting scrape operation for URL: ${url}`, {url});

	const browserOptions = {
		headless: true,
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-dev-shm-usage',
			'--disable-blink-features=AutomationControlled', // Hide automation
			'--disable-infobars',
		],
		executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
	};

	let browser;
	try {
		browser = await playwright.chromium.launch(browserOptions);

		// Create a more human-like context
		const context = await browser.newContext({
			userAgent:
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
			viewport: {width: 1920, height: 1080},
			deviceScaleFactor: 1,
			hasTouch: false,
			isMobile: false,
			javaScriptEnabled: true,
			locale: 'en-US',
			timezoneId: 'America/New_York',
			permissions: ['geolocation'],
		});

		// Add human-like behaviors
		await context.addInitScript(() => {
			// Override automation flags
			Object.defineProperty(navigator, 'webdriver', {get: () => false});
			Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
			Object.defineProperty(navigator, 'languages', {
				get: () => ['en-US', 'en'],
			});
		});

		const page = await context.newPage();

		// Add random mouse movements
		await page.mouse.move(Math.random() * 500, Math.random() * 500);

		logger.info('Navigating to page...', {url});

		// Get options or use defaults
		const timeout = request.options?.timeout || DEFAULT_TIMEOUT;
		const preferredWaitUntil = request.options?.waitUntil;

		// Try loading with different strategies
		let loaded = false;
		let lastError;

		// First try the preferred strategy if specified
		if (preferredWaitUntil) {
			try {
				await page.goto(url, {
					waitUntil: preferredWaitUntil,
					timeout: timeout,
				});
				loaded = true;
				logger.success(
					`Page loaded successfully with ${preferredWaitUntil} strategy`,
				);
			} catch (error: any) {
				lastError = error;
				logger.warn(
					`Failed to load with ${preferredWaitUntil} strategy: ${error.message}`,
				);
			}
		}

		// If not loaded and no preferred strategy, try each in order
		if (!loaded) {
			for (const strategy of WAIT_STRATEGIES) {
				if (strategy === preferredWaitUntil) continue; // Skip if already tried

				try {
					await page.goto(url, {
						waitUntil: strategy,
						timeout: strategy === 'networkidle' ? EXTENDED_TIMEOUT : timeout,
					});
					loaded = true;
					logger.success(`Page loaded successfully with ${strategy} strategy`);
					break;
				} catch (error: any) {
					lastError = error;
					logger.warn(
						`Failed to load with ${strategy} strategy: ${error.message}`,
					);
				}
			}
		}

		if (!loaded) {
			throw lastError || new Error('Failed to load page with all strategies');
		}

		logger.success('Page loaded successfully');

		// Wait for content with better timeouts and checks
		await page.waitForSelector('body', {timeout: 30000});
		await page.waitForTimeout(Math.random() * 2000 + 1000); // Random delay

		// Scroll the page like a human
		await page.evaluate(() => {
			const scrollHeight = document.documentElement.scrollHeight;
			const viewportHeight = window.innerHeight;
			let scrollTop = 0;

			while (scrollTop < scrollHeight) {
				scrollTop += Math.floor(Math.random() * viewportHeight * 0.8);
				window.scrollTo(0, scrollTop);
			}
		});

		await page.waitForTimeout(Math.random() * 1000 + 500); // Another random delay

		// Basic cleanup of non-content elements
		await page.evaluate(() => {
			const cleanup = () => {
				const unwanted = ['script', 'style', 'noscript'];
				unwanted.forEach(tag => {
					document.querySelectorAll(tag).forEach(el => el.remove());
				});
			};
			cleanup();
		});

		const pageContent = await page.content();
		const $ = cheerio.load(pageContent);

		// Extract metadata
		const metadata = {
			title: $('title').text().trim() || $('h1').first().text().trim(),
			description:
				$('meta[name="description"]').attr('content')?.trim() ||
				$('meta[property="og:description"]').attr('content')?.trim(),
			url: url,
			scrapedAt: new Date().toISOString(),
		};

		// Extract all links
		logger.info('Extracting links from page...');
		const links = extractLinks($, url);
		logger.success(`Found ${links.length} valid links`);

		// Get the full body content
		const content = $('body').html() || '';

		logger.success('Content successfully scraped');
		return {
			content,
			links,
			metadata,
		};
	} catch (error: any) {
		const errorMsg = error.message || 'Unknown error during scraping';
		logger.error('Scraping error:', {error: errorMsg, url});
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
		if (browser) {
			await browser.close();
			logger.debug('Browser closed');
		}
	}
}
