import {
	CompanyScrapeHistory,
	ICompanyScrapeHistory,
	ScrapeLink,
} from '../models/CompanyScrapeHistory';
import {connectDB} from '@/config/database';
import {Logger} from '../utils/logger';
import mongoose from 'mongoose';
import {ExtractedLink} from '../utils/scraper';

const logger = new Logger('ScrapeHistoryService');

export class ScrapeHistoryService {
   static async getLastScrape(
	   companyId: string,
	   userId: string,
   ): Promise<ICompanyScrapeHistory | null> {
		try {
			await connectDB();
		   return await CompanyScrapeHistory.findOne({
			   companyId: new mongoose.Types.ObjectId(companyId),
			   userId,
		   });
		} catch (error: any) {
			throw new Error(`Error getting last scrape: ${error.message}`);
		}
	}

   static async recordScrape(
	   companyId: string,
	   userId: string,
	   links: ExtractedLink[],
   ): Promise<ICompanyScrapeHistory> {
		try {
			await connectDB();
			const objectId = new mongoose.Types.ObjectId(companyId);

			// Ensure all required fields are present and strings
			const scrapeLinks = links.map(link => ({
				url: String(link.url),
				text: String(link.text || ''),
				context: String(link.context || ''),
				title: link.title ? String(link.title) : undefined,
			}));

		   const update = {
			   companyId: objectId,
			   userId,
			   lastScrapeDate: new Date(),
			   links: scrapeLinks,
		   };

		   return await CompanyScrapeHistory.findOneAndUpdate(
			   {companyId: objectId, userId},
			   update,
			   {upsert: true, new: true},
		   );
		} catch (error: any) {
			throw new Error(`Error recording scrape: ${error.message}`);
		}
	}

   static async findNewLinks(
	   companyId: string,
	   userId: string,
	   currentLinks: ExtractedLink[],
   ): Promise<string[]> {
		try {
			await connectDB();
		   const lastScrape = await this.getLastScrape(companyId, userId);
			if (!lastScrape) {
				// All URLs are new if no previous scrape exists
				return currentLinks.map(link => String(link.url));
			}

			// Get unique URLs from last scrape
			const lastScrapeUrls = new Set(
				lastScrape.links.map(link => String(link.url)),
			);

			// Return URLs that don't exist in the last scrape
			return currentLinks
				.filter(link => !lastScrapeUrls.has(String(link.url)))
				.map(link => String(link.url));
		} catch (error: any) {
			throw new Error(`Error finding new links: ${error.message}`);
		}
	}
}
