import {describe, it, expect, vi, beforeEach} from 'vitest';
import {POST, OPTIONS} from '../route';
import {scrapeWebsite} from '@/utils/scraper';
import {ICompany, WorkModel} from '@/models/Company';
import {NextRequest} from 'next/server';

vi.mock('@/utils/scraper');
vi.mock('@/utils/logger', () => ({
	Logger: vi.fn().mockImplementation(() => ({
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		success: vi.fn(),
	})),
}));

const mockScrapeWebsite = vi.mocked(scrapeWebsite);

describe('/api/scrape', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('OPTIONS /api/scrape', () => {
		it('should handle CORS preflight request', async () => {
			const response = await OPTIONS();

			expect(response.status).toBe(200);
			expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
			expect(response.headers.get('Access-Control-Allow-Methods')).toBe(
				'GET, POST, PUT, DELETE, OPTIONS',
			);
			expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
				'Content-Type, Authorization',
			);
		});
	});

	describe('POST /api/scrape', () => {
		it('should scrape a single URL successfully', async () => {
			const mockScrapeResult = {
				content: 'Job posting content here',
				links: [
					{
						url: 'https://company.com/job1',
						text: 'Software Engineer',
						context: 'Engineering team',
						title: 'Software Engineer Position',
						isExternal: false,
					},
					{
						url: 'https://company.com/job2',
						text: 'Frontend Developer',
						context: 'Frontend team',
						title: 'Frontend Developer Role',
						isExternal: false,
					},
				],
				metadata: {
					url: 'https://company.com/careers',
					scrapedAt: '2023-01-01T00:00:00.000Z',
				},
			};

			mockScrapeWebsite.mockResolvedValue(mockScrapeResult);

			const request = new NextRequest('http://localhost:3000/api/scrape', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({url: 'https://company.com/careers'}),
			});

			const response = await POST(request);
			const responseData = await response.json();

			expect(response.status).toBe(200);
			expect(responseData).toEqual({
				content: 'Job posting content here',
				links: mockScrapeResult.links,
				metadata: mockScrapeResult.metadata,
			});
			expect(mockScrapeWebsite).toHaveBeenCalledWith({
				url: 'https://company.com/careers',
			});
			expect(mockScrapeWebsite).toHaveBeenCalledTimes(1);
		});

		it('should scrape multiple companies successfully', async () => {
			const mockCompanies: Partial<ICompany>[] = [
				{
					id: 'company-1',
					companyID: 'company-1',
					company: 'Tech Corp',
					careers_url: 'https://techcorp.com/careers',
					work_model: WorkModel.HYBRID,
					headquarters: 'San Francisco, CA',
					office_locations: ['San Francisco'],
					fields: ['Technology'],
					openToApplication: true,
					ranking: 85,
					isProblematic: false,
					scrapeErrors: [],
				},
				{
					id: 'company-2',
					companyID: 'company-2',
					company: 'StartupCo',
					careers_url: 'https://startupco.com/jobs',
					work_model: WorkModel.FULLY_REMOTE,
					headquarters: 'Austin, TX',
					office_locations: ['Austin'],
					fields: ['AI', 'Machine Learning'],
					openToApplication: true,
					ranking: 90,
					isProblematic: false,
					scrapeErrors: [],
				},
			];

			const mockScrapeResults = [
				{
					content: 'Tech Corp jobs content',
					links: [
						{
							url: 'https://techcorp.com/job1',
							text: 'Senior Engineer',
							context: 'Engineering',
							title: 'Senior Software Engineer',
							isExternal: false,
						},
					],
					metadata: {
						url: 'https://techcorp.com/careers',
						scrapedAt: '2023-01-01T00:00:00.000Z',
					},
				},
				{
					content: 'StartupCo jobs content',
					links: [
						{
							url: 'https://startupco.com/job1',
							text: 'ML Engineer',
							context: 'AI Team',
							title: 'Machine Learning Engineer',
							isExternal: false,
						},
					],
					metadata: {
						url: 'https://startupco.com/jobs',
						scrapedAt: '2023-01-01T00:00:00.000Z',
					},
				},
			];

			mockScrapeWebsite
				.mockResolvedValueOnce(mockScrapeResults[0])
				.mockResolvedValueOnce(mockScrapeResults[1]);

			const request = new NextRequest('http://localhost:3000/api/scrape', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({companies: mockCompanies}),
			});

			const response = await POST(request);
			const responseData = await response.json();

			expect(response.status).toBe(200);
			expect(Array.isArray(responseData)).toBe(true);
			expect(responseData).toHaveLength(2);

			expect(responseData[0]).toEqual({
				companyId: 'company-1',
				...mockScrapeResults[0],
			});

			expect(responseData[1]).toEqual({
				companyId: 'company-2',
				...mockScrapeResults[1],
			});

			expect(mockScrapeWebsite).toHaveBeenCalledTimes(2);
			expect(mockScrapeWebsite).toHaveBeenCalledWith(
				{url: 'https://techcorp.com/careers'},
				mockCompanies[0],
			);
			expect(mockScrapeWebsite).toHaveBeenCalledWith(
				{url: 'https://startupco.com/jobs'},
				mockCompanies[1],
			);
		});

		it('should handle mixed success and failure in batch processing', async () => {
			const mockCompanies: Partial<ICompany>[] = [
				{
					id: 'company-success',
					companyID: 'company-success',
					company: 'Success Corp',
					careers_url: 'https://success.com/careers',
					work_model: WorkModel.HYBRID,
					headquarters: 'New York, NY',
					office_locations: ['New York'],
					fields: ['Technology'],
					openToApplication: true,
					ranking: 85,
					isProblematic: false,
					scrapeErrors: [],
				},
				{
					id: 'company-fail',
					companyID: 'company-fail',
					company: 'Fail Corp',
					careers_url: 'https://fail.com/careers',
					work_model: WorkModel.IN_OFFICE,
					headquarters: 'Boston, MA',
					office_locations: ['Boston'],
					fields: ['Technology'],
					openToApplication: true,
					ranking: 75,
					isProblematic: false,
					scrapeErrors: [],
				},
			];

			const successResult = {
				content: 'Success Corp content',
				links: [
					{
						url: 'https://success.com/job1',
						text: 'Developer',
						context: 'Engineering',
						title: 'Software Developer',
						isExternal: false,
					},
				],
				metadata: {
					url: 'https://success.com/careers',
					scrapedAt: '2023-01-01T00:00:00.000Z',
				},
			};

			mockScrapeWebsite
				.mockResolvedValueOnce(successResult)
				.mockRejectedValueOnce(new Error('Scraping failed'));

			const request = new NextRequest('http://localhost:3000/api/scrape', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({companies: mockCompanies}),
			});

			const response = await POST(request);
			const responseData = await response.json();

			expect(response.status).toBe(200);
			expect(Array.isArray(responseData)).toBe(true);
			expect(responseData).toHaveLength(2);

			expect(responseData[0]).toEqual({
				companyId: 'company-success',
				...successResult,
			});

			expect(responseData[1]).toEqual({
				companyId: 'company-fail',
				content: '',
				links: [],
				error: 'Scraping failed',
				metadata: {
					url: 'https://fail.com/careers',
					scrapedAt: expect.any(String),
				},
			});

			expect(mockScrapeWebsite).toHaveBeenCalledTimes(2);
		});

		it('should return empty results when scraping returns no content', async () => {
			const mockScrapeResult = {
				content: '',
				links: [],
				metadata: {
					url: 'https://empty.com/careers',
					scrapedAt: '2023-01-01T00:00:00.000Z',
				},
			};

			mockScrapeWebsite.mockResolvedValue(mockScrapeResult);

			const request = new NextRequest('http://localhost:3000/api/scrape', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({url: 'https://empty.com/careers'}),
			});

			const response = await POST(request);
			const responseData = await response.json();

			expect(response.status).toBe(200);
			expect(responseData).toEqual({
				content: '',
				links: [],
				metadata: mockScrapeResult.metadata,
			});
		});
	});
});
