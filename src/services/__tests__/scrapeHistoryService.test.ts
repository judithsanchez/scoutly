import {describe, it, expect, vi, beforeEach} from 'vitest';
import {ScrapeHistoryService} from '../scrapeHistoryService';
import {CompanyScrapeHistory} from '@/models/CompanyScrapeHistory';
import mongoose from 'mongoose';
import {Logger} from '@/utils/logger';
import type {ExtractedLink} from '@/utils/scraper';

// Mock dependencies
vi.mock('@/models/CompanyScrapeHistory', () => ({
	CompanyScrapeHistory: {
		findOne: vi.fn(),
		findOneAndUpdate: vi.fn(),
	},
}));

vi.mock('@/utils/logger', () => ({
	Logger: vi.fn().mockImplementation(() => ({
		debug: vi.fn(),
	})),
}));

vi.mock('mongoose', () => {
	class MockObjectId {
		private readonly id: string;

		constructor(id: string) {
			this.id = id;
		}

		toString() {
			return this.id;
		}

		static isValid(id: string) {
			return true;
		}
	}

	return {
		default: {
			Types: {
				ObjectId: MockObjectId,
			},
		},
	};
});

const mockCompanyScrapeHistory = vi.mocked(CompanyScrapeHistory);
const companyId = '507f1f77bcf86cd799439011';
const userEmail = 'test@example.com';

describe('ScrapeHistoryService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getLastScrape', () => {
		it('should return last scrape for company and user', async () => {
			const mockScrapeHistory = {
				companyId,
				userEmail,
				lastScrapeDate: new Date('2023-01-01T00:00:00.000Z'),
				links: [{url: 'http://example.com', text: 'Example'}],
			} as any;

			mockCompanyScrapeHistory.findOne.mockResolvedValueOnce(mockScrapeHistory);

			const result = await ScrapeHistoryService.getLastScrape(
				companyId,
				userEmail,
			);

			expect(result).toEqual(mockScrapeHistory);
			expect(mockCompanyScrapeHistory.findOne).toHaveBeenCalledWith({
				companyId: expect.any(mongoose.Types.ObjectId),
				userEmail,
			});
		});

		it('should return null when no scrape history exists', async () => {
			mockCompanyScrapeHistory.findOne.mockResolvedValueOnce(null);

			const result = await ScrapeHistoryService.getLastScrape(
				companyId,
				userEmail,
			);

			expect(result).toBeNull();
		});
	});

	describe('recordScrape', () => {
		it('should record new scrape history', async () => {
			const mockLinks: ExtractedLink[] = [
				{
					url: 'http://example.com',
					text: 'Example',
					context: 'test',
					isExternal: true,
				},
				{
					url: 'http://test.com',
					text: 'Test',
					context: 'test',
					isExternal: true,
				},
			];

			const expectedUpdate = {
				companyId: expect.any(mongoose.Types.ObjectId),
				userEmail,
				lastScrapeDate: expect.any(Date),
				links: mockLinks.map(link => ({
					url: link.url,
					text: link.text,
					context: link.context,
				})),
			};

			const mockResult = {
				...expectedUpdate,
				_id: 'mock-id',
			} as any;

			mockCompanyScrapeHistory.findOneAndUpdate.mockResolvedValueOnce(
				mockResult,
			);

			const result = await ScrapeHistoryService.recordScrape(
				companyId,
				userEmail,
				mockLinks,
			);

			expect(result).toEqual(mockResult);
			expect(mockCompanyScrapeHistory.findOneAndUpdate).toHaveBeenCalledWith(
				{companyId: expect.any(mongoose.Types.ObjectId), userEmail},
				expectedUpdate,
				{upsert: true, new: true},
			);
		});
	});

	describe('findNewLinks', () => {
		it('should return all URLs if no previous scrape exists', async () => {
			mockCompanyScrapeHistory.findOne.mockResolvedValueOnce(null);

			const currentLinks: ExtractedLink[] = [
				{
					url: 'http://example.com',
					text: 'Example',
					context: 'test',
					isExternal: true,
				},
				{
					url: 'http://test.com',
					text: 'Test',
					context: 'test',
					isExternal: true,
				},
			];

			const result = await ScrapeHistoryService.findNewLinks(
				companyId,
				userEmail,
				currentLinks,
			);

			expect(result).toEqual(['http://example.com', 'http://test.com']);
		});

		it('should return only new URLs compared to last scrape', async () => {
			const lastScrape = {
				links: [
					{url: 'http://example.com', text: 'Example'},
					{url: 'http://old.com', text: 'Old'},
				],
			} as any;

			mockCompanyScrapeHistory.findOne.mockResolvedValueOnce(lastScrape);

			const currentLinks: ExtractedLink[] = [
				{
					url: 'http://example.com',
					text: 'Example',
					context: 'test',
					isExternal: true,
				},
				{
					url: 'http://test.com',
					text: 'Test',
					context: 'test',
					isExternal: true,
				},
			];

			const result = await ScrapeHistoryService.findNewLinks(
				companyId,
				userEmail,
				currentLinks,
			);

			expect(result).toEqual(['http://test.com']);
		});
	});
});
