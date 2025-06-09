import {
	CompanyScrapeHistory,
	ICompanyScrapeHistory,
} from '../models/CompanyScrapeHistory';
import {Logger} from '../utils/logger';
import mongoose from 'mongoose';

const logger = new Logger('ScrapeHistoryService');

export class ScrapeHistoryService {
	static async getLastScrape(
		companyId: string,
		userEmail: string,
	): Promise<ICompanyScrapeHistory | null> {
		try {
			return await CompanyScrapeHistory.findOne({
				companyId: new mongoose.Types.ObjectId(companyId),
				userEmail,
			});
		} catch (error: any) {
			throw new Error(`Error getting last scrape: ${error.message}`);
		}
	}

	static async recordScrape(
		companyId: string,
		userEmail: string,
		links: string[],
	): Promise<ICompanyScrapeHistory> {
		try {
			const objectId = new mongoose.Types.ObjectId(companyId);
			const update = {
				companyId: objectId,
				userEmail,
				lastScrapeDate: new Date(),
				links,
			};

			return await CompanyScrapeHistory.findOneAndUpdate(
				{companyId: objectId, userEmail},
				update,
				{upsert: true, new: true},
			);
		} catch (error: any) {
			throw new Error(`Error recording scrape: ${error.message}`);
		}
	}

	static async findNewLinks(
		companyId: string,
		userEmail: string,
		currentLinks: string[],
	): Promise<string[]> {
		try {
			const lastScrape = await this.getLastScrape(companyId, userEmail);
			if (!lastScrape) {
				return currentLinks; // All links are new if no previous scrape exists
			}

			// Return only links that weren't in the last scrape
			return currentLinks.filter(link => !lastScrape.links.includes(link));
		} catch (error: any) {
			throw new Error(`Error finding new links: ${error.message}`);
		}
	}
}
