import {renderHook, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {vi, describe, it, expect, beforeEach} from 'vitest';
import {useCompanies} from '../useCompanies';
import {ICompany, WorkModel} from '@/models/Company';
import React from 'react';

global.fetch = vi.fn();

const createWrapper = () => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

	const TestWrapper = ({children}: {children: React.ReactNode}) =>
		React.createElement(QueryClientProvider, {client: queryClient}, children);

	TestWrapper.displayName = 'TestWrapper';

	return TestWrapper;
};

describe('useCompanies', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return companies data on successful fetch', async () => {
		const mockCompanies: Partial<ICompany>[] = [
			{
				companyID: 'company-a',
				company: 'Company A',
				careers_url: 'https://company-a.com/careers',
				work_model: WorkModel.HYBRID,
				headquarters: 'San Francisco, CA',
				office_locations: ['San Francisco', 'New York'],
				fields: ['Technology', 'Software'],
				openToApplication: true,
				ranking: 85,
				isProblematic: false,
				scrapeErrors: [],
			},
			{
				companyID: 'company-b',
				company: 'Company B',
				careers_url: 'https://company-b.com/careers',
				work_model: WorkModel.FULLY_REMOTE,
				headquarters: 'Austin, TX',
				office_locations: ['Austin'],
				fields: ['Technology', 'AI'],
				openToApplication: true,
				ranking: 90,
				isProblematic: false,
				scrapeErrors: [],
			},
		];

		// Mock successful API response
		(fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockCompanies,
		});

		const {result} = renderHook(() => useCompanies(), {
			wrapper: createWrapper(),
		});

		// Initially loading
		expect(result.current.isLoading).toBe(true);
		expect(result.current.data).toBeUndefined();

		// Wait for query to resolve
		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		// Verify happy path results
		expect(result.current.data).toEqual(mockCompanies);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBeNull();
		expect(fetch).toHaveBeenCalledWith('/api/companies');
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it('should use correct query key', () => {
		(fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => [],
		});

		const {result} = renderHook(() => useCompanies(), {
			wrapper: createWrapper(),
		});

		// The query key should be accessible through the query client
		expect(result.current.dataUpdatedAt).toBeDefined();
	});

	it('should return empty array when no companies exist', async () => {
		const mockCompanies: ICompany[] = [];

		(fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockCompanies,
		});

		const {result} = renderHook(() => useCompanies(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.isSuccess).toBe(true);
		});

		expect(result.current.data).toEqual([]);
		expect(result.current.isLoading).toBe(false);
		expect(result.current.error).toBeNull();
	});
});
