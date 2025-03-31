import {NextRequest, NextResponse} from 'next/server';
import {scrapeWebsite} from '@/utils/scraper';
import {Logger} from '@/utils/logger';

const logger = new Logger('ScrapeAPI');

export async function POST(request: NextRequest) {
	logger.info('Received scrape request');

	try {
		const body = await request.json();

		if (!body || !body.url) {
			logger.warn('Missing URL in request body');
			return NextResponse.json({error: 'URL is required'}, {status: 400});
		}

		const url = body.url;
		logger.info(`Processing scrape request for URL: ${url}`);

		try {
			new URL(url);
		} catch (error) {
			logger.warn(`Invalid URL format: ${url}`, error);
			return NextResponse.json({error: 'Invalid URL format'}, {status: 400});
		}

		logger.info(`Starting scrape operation for: ${url}`);
		// Pass the complete request object with both url and selector
		const result = await scrapeWebsite({
			url: body.url,
			selector: body.selector,
		});

		if (result.error) {
			logger.error(`Scrape operation failed: ${result.error}`);
			return NextResponse.json({error: result.error}, {status: 500});
		}

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
