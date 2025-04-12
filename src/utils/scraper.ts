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

	// Find job links using more general patterns that cover common HTML structures
	$(
		[
			// Common job listing patterns
			'a[href*="job"]',
			'a[href*="career"]',
			'a[href*="position"]',
			// Header patterns
			'h1 > a[href]',
			'h2 > a[href]',
			'h3 > a[href]',
			// Common job containers
			'.job a[href]',
			'.position a[href]',
			'.vacancy a[href]',
			'.listing a[href]',
			'[class*="job"] a[href]',
			'[class*="career"] a[href]',
			// Common link patterns
			'a[href]:has(h1)',
			'a[href]:has(h2)',
			'a[href]:has(h3)',
			// Specific structures we know about
			'a.job-title-link',
			'.jobs__job a[href]',
		].join(', '),
	).each((_, element) => {
		const $el = $(element);
		const href = $el.attr('href');
		if (!href) return;

		try {
			// Skip non-job URLs and common action URLs
			if (
				href.match(
					/\/(apply|login|auth|signup|register|contact|about|search)/i,
				) ||
				href.match(/\.(pdf|doc|docx|zip|jpg|png)$/i) ||
				href.includes('#') ||
				href === '/' ||
				href.length < 2
			)
				return;

			const jobUrl = href.startsWith('http')
				? href
				: href.startsWith('/')
				? new URL(href, baseUrl).toString()
				: `${baseUrl}${href}`;

			// Get title from either Angular Material structure or standard HTML
			let title;
			const titleEl = $el.find('span[itemprop="title"]');
			if (titleEl.length > 0) {
				title = titleEl.text().trim();
			} else {
				title = $el.text().trim();
			}

			// Skip if no title or if it's an apply button
			if (!title || ['Apply Now', 'Apply', 'Read more'].includes(title)) return;

			// Try to get structured job details
			let location, category, description;

			// Try metadata first (schema.org, opengraph, etc)
			const metaContainer = $el.closest(
				'article, [itemtype*="JobPosting"], [typeof*="JobPosting"]',
			);
			if (metaContainer.length) {
				// Try different metadata patterns
				location = metaContainer
					.find(
						[
							'[itemprop="jobLocation"]',
							'[property="job:location"]',
							'[name="job-location"]',
							'[data-location]',
							'.location',
						].join(', '),
					)
					.first()
					.text()
					.trim();

				description = metaContainer
					.find(
						[
							'[itemprop="description"]',
							'[property="job:description"]',
							'[name="job-description"]',
							'.description',
							'.summary',
						].join(', '),
					)
					.first()
					.text()
					.trim();

				category = metaContainer
					.find(
						[
							'[itemprop="occupationalCategory"]',
							'[property="job:category"]',
							'[name="job-category"]',
							'.category',
							'.department',
						].join(', '),
					)
					.first()
					.text()
					.trim();
			}
			// Fallback to Angular Material structure if present
			else if ($el.closest('mat-expansion-panel-header').length) {
				const panelHeader = $el.closest('mat-expansion-panel-header');
				const descriptionContainer = panelHeader.find('.description-container');
				const locationElement = descriptionContainer
					?.find('[itemprop="location"]')
					.parent()
					.find('.label-value.location');
				const categoryElement = descriptionContainer
					?.find('[itemprop="categories"]')
					.parent()
					.find('.label-value');

				location = locationElement?.text().trim();
				category = categoryElement?.text().trim();
				description = `${category || ''} - ${location || ''}`.trim();
			} else {
				// Try to get unstructured job details (e.g., from standard HTML)
				const jobContainer = $el.closest(
					[
						// Common job containers
						'[class*="job"]',
						'[class*="career"]',
						'[class*="position"]',
						'[class*="vacancy"]',
						'[class*="listing"]',
						'article',
						'section',
						'.content',
						// Known specific containers
						'.jobs__job',
						'.job-posting',
						'mat-expansion-panel-header',
					].join(', '),
				);
				if (jobContainer.length) {
					// Get description from paragraphs following the title
					const paragraphs = jobContainer
						.find('p')
						.map((_, el) => $(el).text().trim())
						.get();
					description = paragraphs.join('\n').trim();

					// Try to extract location from description
					const locationMatch = description.match(
						/location|based in|remote.*(?:in|from)\s+([^.]+)/i,
					);
					if (locationMatch) {
						location = locationMatch[1].trim();
					}
				}
			}

			// If we have a title
			if (title && title.length > 0) {
				const jobData = {
					url: jobUrl,
					title,
					location: location || undefined,
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

		// Wait for Angular Material content to load
		await page
			.waitForSelector('mat-expansion-panel-header', {timeout: 10000})
			.catch(() => {
				logger.warn(
					'Angular Material elements not found, continuing with default scraping',
				);
			});

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
