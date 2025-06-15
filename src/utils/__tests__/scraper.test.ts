import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';

vi.mock('playwright', () => {
	const mockPage = {
		goto: vi.fn(),
		content: vi.fn(),
		mouse: {
			move: vi.fn(),
		},
		evaluate: vi.fn(),
		waitForTimeout: vi.fn(),
	};

	const mockContext = {
		newPage: vi.fn().mockResolvedValue(mockPage),
		addInitScript: vi.fn(),
	};

	const mockBrowser = {
		newContext: vi.fn().mockResolvedValue(mockContext),
		close: vi.fn(),
	};

	const mockChromium = {
		launch: vi.fn().mockResolvedValue(mockBrowser),
	};

	return {
		default: {
			chromium: mockChromium,
		},
		chromium: mockChromium,
	};
});

vi.mock('cheerio', () => ({
	load: vi.fn(),
}));

vi.mock('../logger', () => ({
	Logger: vi.fn().mockImplementation(() => ({
		info: vi.fn().mockResolvedValue(undefined),
		debug: vi.fn().mockResolvedValue(undefined),
		success: vi.fn().mockResolvedValue(undefined),
		warn: vi.fn().mockResolvedValue(undefined),
		error: vi.fn().mockResolvedValue(undefined),
	})),
}));

import {scrapeWebsite} from '../scraper';
import type {ScrapeRequest} from '../scraper';
import playwright from 'playwright';
import * as cheerio from 'cheerio';

describe('scrapeWebsite', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		const mockChromium = playwright.chromium;
		const mockBrowser = vi.mocked(mockChromium.launch).mock.results[0]
			?.value || {newContext: vi.fn(), close: vi.fn()};
		const mockContext = vi.mocked(mockBrowser.newContext).mock.results[0]
			?.value || {newPage: vi.fn(), addInitScript: vi.fn()};
		const mockPage = vi.mocked(mockContext.newPage).mock.results[0]?.value || {
			goto: vi.fn(),
			content: vi.fn(),
			mouse: {move: vi.fn()},
			evaluate: vi.fn(),
			waitForTimeout: vi.fn(),
		};

		vi.mocked(mockChromium.launch).mockResolvedValue(mockBrowser);
		vi.mocked(mockBrowser.newContext).mockResolvedValue(mockContext);
		vi.mocked(mockContext.newPage).mockResolvedValue(mockPage);

		vi.mocked(mockPage.goto).mockResolvedValue(undefined);
		vi.mocked(mockPage.content).mockResolvedValue(
			'<html><body><h1>Test Page</h1><a href="/test">Test Link</a></body></html>',
		);
		vi.mocked(mockPage.evaluate).mockResolvedValue(true);
		vi.mocked(mockPage.waitForTimeout).mockResolvedValue(undefined);

		const createMockCheerioElement = () => ({
			html: vi
				.fn()
				.mockReturnValue('<h1>Test Page</h1><a href="/test">Test Link</a>'),
			text: vi.fn().mockReturnValue('Test Page'),
			attr: vi.fn().mockReturnValue('Test description'),
			first: vi.fn().mockReturnThis(),
			each: vi.fn(callback => {
				if (typeof callback === 'function') {
					const mockElement = {};
					callback(0, mockElement);
				}
				return createMockCheerioElement();
			}),
			prevAll: vi.fn().mockReturnValue({
				slice: vi.fn().mockReturnValue({
					each: vi.fn(),
				}),
			}),
			nextAll: vi.fn().mockReturnValue({
				slice: vi.fn().mockReturnValue({
					each: vi.fn(),
				}),
			}),
			parent: vi.fn().mockReturnValue({
				length: 1,
				text: vi.fn().mockReturnValue('Parent context'),
			}),
			length: 1,
		});

		const mockCheerioAPI = Object.assign(
			vi.fn((selector: string) => {
				const element = createMockCheerioElement();

				if (selector === 'a[href]') {
					element.each = vi.fn(callback => {
						if (typeof callback === 'function') {
							const mockLinkElement = {};
							const mockLinkCheerio = {
								attr: vi.fn((attr: string) => {
									if (attr === 'href') return '/test';
									if (attr === 'title') return 'Test Title';
									return undefined;
								}),
								text: vi.fn().mockReturnValue('Test Link'),
								prevAll: vi.fn().mockReturnValue({
									slice: vi.fn().mockReturnValue({
										each: vi.fn(),
									}),
								}),
								nextAll: vi.fn().mockReturnValue({
									slice: vi.fn().mockReturnValue({
										each: vi.fn(),
									}),
								}),
								parent: vi.fn().mockReturnValue({
									length: 1,
									text: vi.fn().mockReturnValue('Parent context'),
								}),
							};

							vi.mocked(cheerio.load).mockImplementation((html: any) => {
								if (html === mockLinkElement) {
									return mockLinkCheerio as any;
								}
								return mockCheerioAPI;
							});

							callback(0, mockLinkElement);
						}
						return element;
					});
				}

				return element;
			}),
			{
				_root: {},
				_options: {},
				fn: {},
				html: vi
					.fn()
					.mockReturnValue(
						'<html><body><h1>Test Page</h1><a href="/test">Test Link</a></body></html>',
					),
				text: vi.fn().mockReturnValue('Test Page'),
				attr: vi.fn().mockReturnValue('Test description'),
				first: vi.fn().mockReturnThis(),
				each: vi.fn(),
				root: vi.fn(),
				contains: vi.fn(),
				merge: vi.fn(),
				parseHTML: vi.fn(),
				xml: vi.fn(),
			},
		);

		vi.mocked(cheerio.load).mockReturnValue(mockCheerioAPI as any);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('should successfully scrape a website with basic content', async () => {
		const request: ScrapeRequest = {
			url: 'https://example.com',
			options: {
				timeout: 30000,
				waitUntil: 'domcontentloaded',
			},
		};

		const result = await scrapeWebsite(request);

		expect(result).toBeDefined();
		expect(result.error).toBeUndefined();
		expect(result.content).toBe(
			'<h1>Test Page</h1><a href="/test">Test Link</a>',
		);
		expect(result.metadata).toMatchObject({
			title: 'Test Page',
			description: 'Test description',
			url: 'https://example.com',
		});
		expect(result.metadata?.scrapedAt).toBeDefined();

		expect(playwright.chromium.launch).toHaveBeenCalledOnce();
	});

	it('should handle URLs without options', async () => {
		const request: ScrapeRequest = {
			url: 'https://example.com',
		};

		const result = await scrapeWebsite(request);

		expect(result).toBeDefined();
		expect(result.error).toBeUndefined();
		expect(playwright.chromium.launch).toHaveBeenCalledOnce();
	});
});
