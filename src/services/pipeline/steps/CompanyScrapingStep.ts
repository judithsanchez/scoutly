/**
 * Company Scraping Pipeline Step
 *
 * Scrapes job listings from company career pages and filters new links
 */

import {Logger} from '@/utils/logger';
import {scrapeJobsWithFiltering} from '@/utils/jobScraper';
import {createUrlSet, filterNewLinks} from '@/utils/dataTransform';
import {ScrapeHistoryService} from '../../scrapeHistoryService';
import type {PipelineStep, PipelineContext} from '../types';
import type {ExtractedLink} from '@/utils/scraper';

const logger = new Logger('CompanyScrapingStep');

export class CompanyScrapingStep implements PipelineStep {
	readonly name = 'CompanyScraping';
	readonly description = 'Scrapes job listings from company career pages';

	/**
	 * Scrape job listings from all companies
	 */
	async execute(context: PipelineContext): Promise<PipelineContext> {
		// Story logging for narrative
		context.storyLogger.addToStory(
			'info',
			'CompanyScraping',
			`Starting to scrape job listings from ${
				context.companies.length
			} companies: ${context.companies.map(c => c.company).join(', ')}`,
		);

		// Debug logging
		logger.info(
			`📝 Scraping job listings from ${context.companies.length} companies...`,
		);

		try {
			// Initialize scraped data map if not exists
			if (!context.scrapedData) {
				context.scrapedData = new Map();
			}

			// Process companies in parallel
			const scrapingResults = await Promise.all(
				context.companies.map(company =>
					this.scrapeCompanyJobs(company, context.userId, context).catch(
						error => {
							logger.error(
								`Failed to scrape company ${company.company}:`,
								error,
							);
							context.storyLogger.addToStory(
								'error',
								'CompanyScraping',
								`❌ Failed to scrape ${company.company}: ${error.message}`,
							);
							return {
								companyId: company.id,
								allScrapedLinks: [],
								newLinks: [],
							};
						},
					),
				),
			);

			// Store results in context
			scrapingResults.forEach(({companyId, newLinks}) => {
				if (newLinks.length > 0) {
					context.scrapedData!.set(companyId, newLinks);
				}
			});

			const totalNewLinks = scrapingResults.reduce(
				(sum, {newLinks}) => sum + newLinks.length,
				0,
			);

			// Story logging for results
			context.storyLogger.addToStory(
				'success',
				'CompanyScraping',
				`✅ Company scraping completed successfully! Found ${totalNewLinks} new job links across ${
					context.companies.length
				} companies. ${scrapingResults
					.map(
						r =>
							`${
								context.companies.find(c => c.companyID === r.companyId)
									?.company
							}: ${r.newLinks.length} new jobs`,
					)
					.join(', ')}`,
				{totalNewLinks, companiesScraped: context.companies.length},
			);

			// Debug logging
			logger.info(
				`✓ Company scraping completed. Found ${totalNewLinks} new job links across ${context.companies.length} companies.`,
			);

			return context;
		} catch (error) {
			logger.error('Failed to scrape companies:', error);
			throw new Error(
				`Company scraping failed: ${
					error instanceof Error ? error.message : 'Unknown error'
				}`,
			);
		}
	}

	/**
	 * Skip if scraping data is already available
	 */
	canSkip(context: PipelineContext): boolean {
		return !!(context.scrapedData && context.scrapedData.size > 0);
	}

	/**
	 * Validate that companies are provided
	 */
	validate(context: PipelineContext): void {
		if (!context.companies || !Array.isArray(context.companies)) {
			throw new Error('Companies array is required for scraping');
		}

		if (context.companies.length === 0) {
			throw new Error('At least one company is required for scraping');
		}

		// Validate individual companies
		context.companies.forEach((company, index) => {
			if (!company || !company.id || !company.company || !company.careers_url) {
				throw new Error(
					`Invalid company data at index ${index}: missing required fields`,
				);
			}
		});
	}

	/**
	 * Scrape jobs for a single company
	 */
	private async scrapeCompanyJobs(
		company: any,
		userId: string,
		context: PipelineContext,
	): Promise<{
		companyId: string;
		allScrapedLinks: ExtractedLink[];
		newLinks: ExtractedLink[];
	}> {
		logger.info(`📝 Step 1: Scraping ${company.company} job listings...`);

		// Scrape the company's career page
		const jobsResult = await scrapeJobsWithFiltering(company.careers_url);

		if (jobsResult.error) {
			logger.error(`Scraping failed for ${company.company}:`, jobsResult.error);
			context.storyLogger.addToStory(
				'error',
				'CompanyScraping',
				`Failed to scrape ${company.company}: ${jobsResult.error}`,
			);
			return {
				companyId: company.id,
				allScrapedLinks: [],
				newLinks: [],
			};
		}

		const allScrapedLinks = jobsResult.links || [];
		logger.info(
			`Found ${allScrapedLinks.length} job links for ${company.company}`,
		);

		if (allScrapedLinks.length === 0) {
			logger.warn(`No job links found for ${company.company}`);
			context.storyLogger.addToStory(
				'warn',
				'CompanyScraping',
				`No job links found for ${company.company} - they may not be hiring right now`,
			);
			return {
				companyId: company.id,
				allScrapedLinks: [],
				newLinks: [],
			};
		}

		// Get historical URLs for filtering
		const history = await ScrapeHistoryService.getLastScrape(
			company.id,
			userId,
		);
		const historicalUrls = history
			? createUrlSet(
					history.links.map(link => ({url: link.url, text: link.text})),
			  )
			: new Set<string>();

		// Filter out previously scraped URLs
		const newLinks = filterNewLinks(allScrapedLinks, historicalUrls);
		logger.info(
			`Filtered to ${newLinks.length} new links for ${company.company} (${
				allScrapedLinks.length - newLinks.length
			} already seen)`,
		);

		// Story logging for individual company results
		if (newLinks.length > 0) {
			context.storyLogger.addToStory(
				'info',
				'CompanyScraping',
				`Found ${newLinks.length} new job postings at ${company.company} (${
					allScrapedLinks.length - newLinks.length
				} were already seen previously)`,
			);
		}

		// Record scrape history for all links
		if (allScrapedLinks.length > 0) {
			await ScrapeHistoryService.recordScrape(
				company.id,
				userId,
				allScrapedLinks,
			);
		}

		return {
			companyId: company.id,
			allScrapedLinks,
			newLinks,
		};
	}

	/**
	 * Handle company scraping errors
	 */
	async onError(error: Error, context: PipelineContext): Promise<void> {
		logger.error('Company scraping step failed:', {
			error: error.message,
			userEmail: context.userEmail,
			companiesCount: context.companies.length,
		});

		// Could implement fallback logic here, such as:
		// - Retry with different scraping strategy
		// - Use cached job listings
		// - Continue with subset of companies that succeeded
	}
}
