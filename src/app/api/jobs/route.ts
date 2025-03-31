import {NextRequest, NextResponse} from 'next/server';
import {scrapeWebsite, ScrapeOptions} from '@/utils/scraper';
import {getStructuredJobData} from '@/utils/gemini';
import {Logger} from '@/utils/logger';

const logger = new Logger('JobsAPI');

export async function POST(request: NextRequest) {
	logger.info('Received job scraping request');

	try {
		const body = await request.json();

		if (!body || !body.url) {
			logger.warn('Missing URL in request body');
			return NextResponse.json({error: 'URL is required'}, {status: 400});
		}

		const url = body.url;
		logger.info(`Processing job scrape request for URL: ${url}`);

		// Set up scrape options with defaults optimized for job listings
		const options: ScrapeOptions = {
			cleanHtml: body.cleanHtml === true,
			textOnly: body.textOnly === true,
			includeMetadata: body.includeMetadata === true,
			selector: body.selector || '.search-results', // Default to common job listing container
			autoDetectContent: body.autoDetectContent === true,
			includeLinks: body.includeLinks !== false, // Default to true for job listings
		};

		try {
			new URL(url);
		} catch (error) {
			logger.warn(`Invalid URL format: ${url}`, error);
			return NextResponse.json({error: 'Invalid URL format'}, {status: 400});
		}

		// Step 1: Scrape the website
		logger.info(`Starting scrape operation for: ${url} with options:`, options);
		const scrapeResult = await scrapeWebsite(url, options);

		if (scrapeResult.error) {
			logger.error(`Scrape operation failed: ${scrapeResult.error}`);
			return NextResponse.json({error: scrapeResult.error}, {status: 500});
		}

		logger.success(
			`Scrape operation successful, content length: ${scrapeResult.content.length} characters`,
		);

		// Step 2: Extract structured job data using Gemini
		logger.info('Processing scraped content with Gemini');

		// Extract company name from URL for context if not provided
		const urlObj = new URL(url);
		const domain = urlObj.hostname.replace('www.', '').split('.')[0];

		// Use provided company name or fallback to domain-based name
		const companyName = body.companyName || domain;
		logger.info(`Using company name: ${companyName} for job data extraction`);

		const companyContext = `This is job listing data from ${companyName}. Extract all job positions with their titles and URLs.`;

		try {
			const jobData = await getStructuredJobData(
				scrapeResult.content,
				companyName,
			);

			logger.success(
				`Successfully extracted ${jobData.openPositions.length} job positions`,
			);

			// Return both the raw scrape result and the structured job data
			return NextResponse.json({
				scrapeResult: {
					content: scrapeResult.content,
					metadata: scrapeResult.metadata,
					pagination: scrapeResult.pagination,
				},
				jobData,
			});
		} catch (error) {
			logger.error('Failed to extract job data with Gemini', error);
			return NextResponse.json({
				scrapeResult,
				error: 'Failed to extract structured job data',
			});
		}
	} catch (error) {
		logger.error('Failed to process request', error);
		return NextResponse.json(
			{error: 'Failed to process request'},
			{status: 400},
		);
	}
}
