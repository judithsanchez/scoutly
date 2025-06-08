import {NextRequest, NextResponse} from 'next/server';
import {scrapeWebsite} from '@/utils/scraper';
import {Logger} from '@/utils/logger';

const logger = new Logger('ScrapeAPI');

// Add CORS headers to the response
function addCorsHeaders(response: NextResponse) {
	response.headers.set('Access-Control-Allow-Origin', '*');
	response.headers.set(
		'Access-Control-Allow-Methods',
		'GET, POST, PUT, DELETE, OPTIONS',
	);
	response.headers.set(
		'Access-Control-Allow-Headers',
		'Content-Type, Authorization',
	);
	return response;
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
	return addCorsHeaders(new NextResponse(null, {status: 200}));
}

export async function POST(request: NextRequest) {
	logger.info('Received scrape request');

	try {
		const body = await request.json();

		if (!body || !body.url) {
			logger.warn('Missing URL in request body');
			return addCorsHeaders(
				NextResponse.json({error: 'URL is required'}, {status: 400}),
			);
		}

		const {url} = body;
		logger.info(`Processing scrape request for URL: ${url}`);

		try {
			new URL(url);
		} catch (error) {
			logger.warn(`Invalid URL format: ${url}`, error);
			return addCorsHeaders(
				NextResponse.json({error: 'Invalid URL format'}, {status: 400}),
			);
		}

		logger.info(`Starting scrape operation for: ${url}`);
		const result = await scrapeWebsite({url});

		if (result.error) {
			logger.error(`Scrape operation failed: ${result.error}`);
			return addCorsHeaders(
				NextResponse.json({error: result.error}, {status: 500}),
			);
		}

		logger.success(
			`Scrape operation successful - Content length: ${result.content.length}, Links found: ${result.links.length}`,
		);

		return addCorsHeaders(
			NextResponse.json({
				content: result.content,
				links: result.links,
				metadata: result.metadata,
			}),
		);
	} catch (error: any) {
		logger.error('Failed to process request', error);
		const errorMessage = error.message || 'Failed to process request';
		return addCorsHeaders(
			NextResponse.json({error: errorMessage}, {status: 500}),
		);
	}
}
