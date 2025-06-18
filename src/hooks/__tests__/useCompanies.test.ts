import {renderHook, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {vi, describe, it, expect, beforeEach} from 'vitest';
import {useCompanies} from '../useCompanies';
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

	return TestWrapper;
};

describe('useCompanies', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return companies data', async () => {
		const mockCompanies = [
			{
				companyID: 'test-company',
				company: 'Test Company',
			},
		];

		(fetch as any)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => mockCompanies,
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({companies: []}),
			});

		const {result} = renderHook(() => useCompanies(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.companies).toEqual(mockCompanies);
	});

	it('should handle empty companies', async () => {
		(fetch as any)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => [],
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({companies: []}),
			});

		const {result} = renderHook(() => useCompanies(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.companies).toEqual([]);
	});

	it('should initialize correctly', () => {
		const {result} = renderHook(() => useCompanies(), {
			wrapper: createWrapper(),
		});

		expect(result.current.companies).toBeDefined();
		expect(Array.isArray(result.current.companies)).toBe(true);
	});
});
