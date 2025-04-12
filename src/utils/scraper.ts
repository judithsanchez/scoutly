import playwright from 'playwright';
import * as cheerio from 'cheerio';
import {Logger} from '@/utils/logger';
import {matchesFilters} from '@/utils/filters';

const logger = new Logger('Scraper');

export interface ScrapeRequest {
	url: string;
	selector?: string;
	company?: string;
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
	error?: string;
}

interface SelectorError {
	company: string;
	url: string;
	selector: string;
	error: string;
	timestamp: string;
}

const selectorErrors: SelectorError[] = [];

async function logSelectorError(
	company: string,
	url: string,
	selector: string,
	error: string,
): Promise<void> {
	const errorLog: SelectorError = {
		company,
		url,
		selector,
		error,
		timestamp: new Date().toISOString(),
	};

	selectorErrors.push(errorLog);
	logger.error('Selector error:', errorLog);
}

// Helper function to check if a job matches our filtering criteria
function jobMatchesFilters(job: JobData): boolean {
	// Combine all text fields for filtering
	const textToCheck = [
		job.url || '',
		job.title || '',
		job.description || '',
	].join(' ');

	// Apply the matchesFilters function from filters.ts
	return matchesFilters(textToCheck);
}

function extractJobs($: cheerio.CheerioAPI, baseUrl: string): JobData[] {
	const jobs = new Set<JobData>();

	// Find all links that might be job postings
	$('h1 a, h2 a, h3 a, h4 a, a').each((_, element) => {
		const $el = $(element);
		const href = $el.attr('href');
		if (!href) return;

		try {
			const jobUrl = new URL(href, baseUrl).toString();
			let title = $el.text().trim();

			// If the link is empty, try to get text from parent heading
			if (!title) {
				title = $el.closest('h1, h2, h3, h4').text().trim();
			}

			// Get surrounding content for context
			const parentElement =
				$el.closest('div, article, section') || $el.parent();
			const surroundingText = parentElement.text().trim();

			// If we have a title
			if (title && title.length > 0) {
				// Create description from surrounding text, excluding the title
				const description = surroundingText.replace(title, '').trim();

				// Optional: Extract location from description if available
				let location: string | undefined;
				const locationMatch = description.match(/Location:\s*([^.]+)/i);
				if (locationMatch) {
					location = locationMatch[1].trim();
				}

				const jobData = {
					url: jobUrl,
					title,
					location,
					description: description || undefined,
				};

				// Only add the job if it passes our filtering criteria
				if (jobMatchesFilters(jobData)) {
					jobs.add(jobData);
				}
			}
		} catch (e) {
			// Skip invalid URLs
		}
	});

	return Array.from(jobs);
}

export async function scrapeWebsite(
	request: ScrapeRequest,
): Promise<ScrapeResult> {
	const {url, selector, company} = request;
	logger.info(`Starting scrape operation for URL: ${url}`);

	const browserOptions = {
		headless: true,
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-dev-shm-usage',
		],
		executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
	};

	let browser;
	try {
		browser = await playwright.chromium.launch(browserOptions);
		const context = await browser.newContext();
		const page = await context.newPage();

		logger.info('Navigating to page...');
		await page.goto(url, {waitUntil: 'networkidle', timeout: 30000});
		logger.success('Page loaded successfully');

		logger.info('Starting auto-scroll to load lazy content...');
		await autoScroll(page);
		logger.success('Auto-scroll completed');

		const pageContent = await page.content();
		const $ = cheerio.load(pageContent);

		if (!selector) {
			logger.info('No selector provided - scraping entire page');
			const bodyContent = $('body').html() || '';
			return {
				content: bodyContent,
				jobs: extractJobs($, url),
			};
		}

		logger.info(`Waiting for selector: ${selector}`);
		try {
			await page.waitForSelector(selector, {timeout: 10000});
		} catch (error) {
			const errorMsg = `Selector not found: ${selector}`;
			logger.error(errorMsg);
			if (company) {
				await logSelectorError(company, url, selector, errorMsg);
			}

			// Fall back to returning whole page content
			const bodyContent = $('body').html() || '';
			return {
				content: bodyContent,
				jobs: extractJobs($, url),
				error: 'Selector not found - returned full page content',
			};
		}

		const selectedElement = $(selector);
		const selectedContent = selectedElement.html() || '';

		if (!selectedContent) {
			const errorMsg = 'Selected element contains no content';
			logger.warn(errorMsg);
			return {
				content: '',
				jobs: [],
				error: errorMsg,
			};
		}

		// Extract jobs from the selected content
		const jobsFromSelectedContent = extractJobs(
			cheerio.load(selectedContent),
			url,
		);

		return {
			content: selectedContent,
			jobs: jobsFromSelectedContent,
		};
	} catch (error: any) {
		const errorMsg = error.message || 'Unknown error during scraping';
		logger.error('Scraping error:', errorMsg);
		return {
			content: '',
			jobs: [],
			error: errorMsg,
		};
	} finally {
		if (browser) {
			await browser.close();
			logger.debug('Browser closed');
		}
	}
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
