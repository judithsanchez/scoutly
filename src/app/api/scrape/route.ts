import {NextRequest, NextResponse} from 'next/server';
import {scrapeWebsite, ScrapeOptions} from '@/utils/scraper';
import {Logger} from '@/utils/logger';

// Create a logger for the API route
const logger = new Logger('ScrapeAPI');

export async function POST(request: NextRequest) {
	logger.info('Received scrape request');

	try {
		const body = await request.json();

		// Validate input
		if (!body || !body.url) {
			logger.warn('Missing URL in request body');
			return NextResponse.json({error: 'URL is required'}, {status: 400});
		}

		const url = body.url;
		logger.info(`Processing scrape request for URL: ${url}`);

		// Extract scrape options
		const options: ScrapeOptions = {
			cleanHtml: body.cleanHtml === true,
			textOnly: body.textOnly === true,
			includeMetadata: body.includeMetadata === true,
			selector: body.selector || undefined,
			autoDetectContent: body.autoDetectContent === true,
		};

		// Validate URL format
		try {
			new URL(url); // Will throw if URL is invalid
		} catch (error) {
			logger.warn(`Invalid URL format: ${url}`, error);
			return NextResponse.json({error: 'Invalid URL format'}, {status: 400});
		}

		// Scrape the website
		logger.info(`Starting scrape operation for: ${url} with options:`, options);
		const result = await scrapeWebsite(url, options);

		if (result.error) {
			logger.error(`Scrape operation failed: ${result.error}`);
			return NextResponse.json({error: result.error}, {status: 500});
		}

		// Log success with content length
		logger.success(
			`Scrape operation successful, content length: ${result.content.length} characters`,
		);
		return NextResponse.json(result);
	} catch (error) {
		logger.error('Failed to process request', error);
		return NextResponse.json(
			{error: 'Failed to process request'},
			{status: 400},
		);
	}
}
