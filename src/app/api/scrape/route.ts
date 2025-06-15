import {NextRequest, NextResponse} from 'next/server';
import {scrapeWebsite} from '@/utils/scraper';
import {Logger} from '@/utils/logger';
import {ICompany} from '@/models/Company';

const logger = new Logger('ScrapeAPI');

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

export async function OPTIONS() {
	return addCorsHeaders(new NextResponse(null, {status: 200}));
}

export async function POST(request: NextRequest) {
	logger.info('Received scrape request');

	try {
		const body = await request.json();
		if (!body || (!body.url && !body.companies)) {
			logger.warn('Missing required parameters in request body');
			return addCorsHeaders(
				NextResponse.json(
					{error: 'URL or companies array is required'},
					{status: 400},
				),
			);
		}

		if (body.companies) {
			if (!Array.isArray(body.companies)) {
				return addCorsHeaders(
					NextResponse.json(
						{error: 'Companies must be an array'},
						{status: 400},
					),
				);
			}

			const MAX_COMPANIES = 10;
			if (body.companies.length > MAX_COMPANIES) {
				return addCorsHeaders(
					NextResponse.json(
						{error: `Maximum of ${MAX_COMPANIES} companies per request`},
						{status: 400},
					),
				);
			}

			logger.info(
				`Processing batch scrape request for ${body.companies.length} companies`,
			);
			const results = await Promise.all(
				body.companies.map(async (company: ICompany) => {
					try {
						const url = company.careers_url;
						new URL(url);
						const result = await scrapeWebsite({url}, company);
						return {
							companyId: company.id,
							...result,
						};
					} catch (error) {
						logger.error(`Failed to scrape company ${company.id}:`, error);
						return {
							companyId: company.id,
							content: '',
							links: [],
							error: error instanceof Error ? error.message : 'Unknown error',
							metadata: {
								url: company.careers_url,
								scrapedAt: new Date().toISOString(),
							},
						};
					}
				}),
			);

			return addCorsHeaders(NextResponse.json(results));
		}

		const {url} = body;
		logger.info(`Processing single URL scrape request for: ${url}`);

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
