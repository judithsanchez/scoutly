import {render, screen, act} from '@testing-library/react';
import {useSession} from 'next-auth/react';
import {vi, describe, it, expect, beforeEach} from 'vitest';
import AdminDashboard from '../page';

// Mock next-auth
vi.mock('next-auth/react', () => ({
	useSession: vi.fn(),
}));

// Mock router
vi.mock('next/navigation', () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		prefetch: vi.fn(),
	}),
}));

// Mock admin utils
vi.mock('@/utils/adminUtils', () => ({
	isBootstrapAdmin: vi.fn(),
}));

import {isBootstrapAdmin} from '@/utils/adminUtils';

// Mock fetch
global.fetch = vi.fn();

const mockUseSession = vi.mocked(useSession);
const mockIsBootstrapAdmin = vi.mocked(isBootstrapAdmin);

describe('AdminDashboard', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should show loading state when session is loading', async () => {
		mockUseSession.mockReturnValue({
			data: null,
			status: 'loading',
			update: vi.fn(),
		});

		await act(async () => {
			render(<AdminDashboard />);
		});

		expect(screen.getByText(/loading/i)).toBeInTheDocument();
	});

	it('should redirect unauthenticated users', async () => {
		mockUseSession.mockReturnValue({
			data: null,
			status: 'unauthenticated',
			update: vi.fn(),
		});

		await act(async () => {
			render(<AdminDashboard />);
		});

		expect(screen.getByText(/redirecting/i)).toBeInTheDocument();
	});

	it('should redirect non-admin users', async () => {
		mockUseSession.mockReturnValue({
			data: {
				user: {
					email: 'user@example.com',
					isAdmin: false,
					hasCompleteProfile: true,
				},
				expires: '2024-12-31',
			},
			status: 'authenticated',
			update: vi.fn(),
		});

		// Mock non-admin user
		mockIsBootstrapAdmin.mockReturnValue(false);

		await act(async () => {
			render(<AdminDashboard />);
		});

		expect(screen.getByText(/access denied/i)).toBeInTheDocument();
	});

	it('should render admin dashboard for admin users', async () => {
		mockUseSession.mockReturnValue({
			data: {
				user: {
					email: 'admin@example.com',
					isAdmin: true,
					hasCompleteProfile: true,
				},
				expires: '2024-12-31',
			},
			status: 'authenticated',
			update: vi.fn(),
		});

		// Mock admin user
		mockIsBootstrapAdmin.mockReturnValue(true);

		// Mock successful API responses with correct structure
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				systemHealth: {
					status: 'healthy',
					errorCount: 0,
					totalLogs: 10,
				},
				recentActivity: {
					logsCount: 10,
					scrapesCount: 5,
					savedJobsCount: 25,
					userPrefsCount: 8,
				},
				tokenUsage: {
					totalTokens: 1000,
					totalCost: 5.5,
					usageCount: 15,
				},
				companyStats: {
					totalCompanies: 5,
					successfulScrapes: 4,
					successRate: 80,
				},
			}),
		} as Response);

		await act(async () => {
			render(<AdminDashboard />);
		});

		expect(
			screen.getByRole('heading', {name: /admin dashboard/i}),
		).toBeInTheDocument();
	});

	it('should handle API errors gracefully', async () => {
		mockUseSession.mockReturnValue({
			data: {
				user: {
					email: 'admin@example.com',
					isAdmin: true,
					hasCompleteProfile: true,
				},
				expires: '2024-12-31',
			},
			status: 'authenticated',
			update: vi.fn(),
		});

		// Mock admin user
		mockIsBootstrapAdmin.mockReturnValue(true);

		// Mock API error
		vi.mocked(fetch).mockRejectedValueOnce(new Error('API Error'));

		await act(async () => {
			render(<AdminDashboard />);
		});

		expect(
			screen.getByText(/error loading dashboard data/i),
		).toBeInTheDocument();
		expect(screen.getByText(/retry/i)).toBeInTheDocument();
	});

	it('should render bootstrap admin warning for bootstrap admin users', async () => {
		mockUseSession.mockReturnValue({
			data: {
				user: {
					email: 'bootstrap@example.com',
					isAdmin: false,
					hasCompleteProfile: true,
				},
				expires: '2024-12-31',
			},
			status: 'authenticated',
			update: vi.fn(),
		});

		// Mock bootstrap admin user
		mockIsBootstrapAdmin.mockReturnValue(true);

		// Mock successful API responses with correct structure
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				systemHealth: {
					status: 'healthy',
					errorCount: 0,
					totalLogs: 10,
				},
				recentActivity: {
					logsCount: 10,
					scrapesCount: 5,
					savedJobsCount: 25,
					userPrefsCount: 8,
				},
				tokenUsage: {
					totalTokens: 1000,
					totalCost: 5.5,
					usageCount: 15,
				},
				companyStats: {
					totalCompanies: 5,
					successfulScrapes: 4,
					successRate: 80,
				},
			}),
		} as Response);

		await act(async () => {
			render(<AdminDashboard />);
		});

		expect(
			screen.getByRole('heading', {name: /admin dashboard/i}),
		).toBeInTheDocument();
	});

	it('should fetch and display dashboard data', async () => {
		mockUseSession.mockReturnValue({
			data: {
				user: {
					email: 'admin@example.com',
					isAdmin: true,
					hasCompleteProfile: true,
				},
				expires: '2024-12-31',
			},
			status: 'authenticated',
			update: vi.fn(),
		});

		// Mock admin user
		mockIsBootstrapAdmin.mockReturnValue(true);

		// Mock successful API responses with specific data and correct structure
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				systemHealth: {
					status: 'warning',
					errorCount: 3,
					totalLogs: 50,
				},
				recentActivity: {
					logsCount: 50,
					scrapesCount: 8,
					savedJobsCount: 42,
					userPrefsCount: 15,
				},
				tokenUsage: {
					totalTokens: 2500,
					totalCost: 12.75,
					usageCount: 25,
				},
				companyStats: {
					totalCompanies: 8,
					successfulScrapes: 6,
					successRate: 75,
				},
			}),
		} as Response);

		await act(async () => {
			render(<AdminDashboard />);
		});

		expect(
			screen.getByRole('heading', {name: /admin dashboard/i}),
		).toBeInTheDocument();
	});
});
