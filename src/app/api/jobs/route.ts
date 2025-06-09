import {Logger} from '@/utils/logger';
import {CompanyService} from '@/services/companyService';
import {UserService} from '@/services/userService';
import {ScrapeHistoryService} from '@/services/scrapeHistoryService';
import {scrapeWebsite} from '@/utils/scraper';
import {ICompany} from '@/models/Company';

const logger = new Logger('JobsAPI');

export interface JobScrapeRequest {
	credentials: {
		gmail: string;
	};
	companyNames: string[];
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const {credentials, companyNames} = body as JobScrapeRequest;

		if (
			!credentials?.gmail ||
			!companyNames ||
			!Array.isArray(companyNames) ||
			companyNames.length === 0
		) {
			return Response.json(
				{error: 'Gmail credentials and company names array are required'},
				{status: 400},
			);
		}

		// Get or create user by gmail
		const user = await UserService.getOrCreateUser(credentials.gmail);

		// Find companies by names
		const companies = await CompanyService.findCompaniesByName(companyNames);

		if (companies.length === 0) {
			return Response.json(
				{error: 'No matching companies found'},
				{status: 404},
			);
		}

		const results = [];

		// Process each company sequentially
		for (const company of companies as ICompany[]) {
			try {
				if (!company.careers_url) {
					logger.warn(`No careers URL found for company: ${company.company}`);
					continue;
				}

				// Scrape the website
				const scrapeResult = await scrapeWebsite(
					{url: company.careers_url},
					company,
				);

				if (scrapeResult.error) {
					logger.error(
						`Error scraping ${company.company}:`,
						scrapeResult.error,
					);
					results.push({
						company: company.company,
						error: scrapeResult.error,
					});
					continue;
				}

				// Find new links
				const newLinks = await ScrapeHistoryService.findNewLinks(
					company.id,
					credentials.gmail,
					scrapeResult.links.map(link => link.url),
				);

				if (newLinks.length === 0) {
					logger.info(`No new links found for ${company.company}`);
					results.push({
						company: company.company,
						newLinks: 0,
						message: 'No new job postings found',
					});
					continue;
				}

				// Record the scrape with all links
				await ScrapeHistoryService.recordScrape(
					company.id,
					credentials.gmail,
					scrapeResult.links.map(link => link.url),
				);

				// Filter scrape results to only include new links
				const newScrapeResults = {
					...scrapeResult,
					links: scrapeResult.links.filter(link => newLinks.includes(link.url)),
				};

				results.push({
					company: company.company,
					newLinks: newLinks.length,
					results: newScrapeResults,
				});
			} catch (error: any) {
				logger.error(`Error processing ${company.company}:`, error);
				results.push({
					company: company.company,
					error: error.message,
				});
			}
		}

		return Response.json({
			results,
			processed: companies.length,
		});
	} catch (error: any) {
		logger.error('Error processing job request:', error);
		return Response.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}
