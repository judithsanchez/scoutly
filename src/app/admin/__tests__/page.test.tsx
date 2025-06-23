import {render, screen, waitFor, act} from '@testing-library/react';
import {useSession} from 'next-auth/react';
import {vi, describe, it, expect, beforeEach} from 'vitest';
import AdminDashboard from '../page';

// Mock next-auth
vi.mock('next-auth/react');
const mockUseSession = vi.mocked(useSession);

// Mock admin utils
vi.mock('@/utils/adminUtils', () => ({
	isBootstrapAdmin: vi.fn(),
}));

import {isBootstrapAdmin} from '@/utils/adminUtils';
const mockIsBootstrapAdmin = vi.mocked(isBootstrapAdmin);

// Mock fetch
global.fetch = vi.fn();
const mockFetch = vi.mocked(fetch);

// Mock admin dashboard data
const mockDashboardData = {
	systemHealth: {
		status: 'healthy',
		errorCount: 0,
		totalLogs: 25,
	},
	recentActivity: {
		logsCount: 25,
		scrapesCount: 10,
		savedJobsCount: 45,
		userPrefsCount: 12,
	},
	tokenUsage: {
		totalTokens: 15000,
		totalCost: 0.45,
		usageCount: 8,
	},
	companyStats: {
		totalCompanies: 10,
		successfulScrapes: 9,
		successRate: 90,
	},
};

describe('AdminDashboard', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Set up environment variable for tests
		vi.stubEnv('ADMIN_EMAIL', 'judithv.sanchezc@gmail.com');
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
				user: {email: 'user@example.com'},
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

	it('should show loading state for admin user', async () => {
		mockUseSession.mockReturnValue({
			data: {
				user: {email: 'judithv.sanchezc@gmail.com'},
				expires: '2024-12-31',
			},
			status: 'authenticated',
			update: vi.fn(),
		});

		// Mock admin user
		mockIsBootstrapAdmin.mockReturnValue(true);

		// Mock pending fetch
		mockFetch.mockReturnValue(
			new Promise(() => {}), // Never resolves to simulate loading
		);

		await act(async () => {
			render(<AdminDashboard />);
		});

		await waitFor(() => {
			expect(screen.getByText(/loading/i)).toBeInTheDocument();
		});
	});

	it('should display dashboard data for admin user', async () => {
		mockUseSession.mockReturnValue({
			data: {
				user: {email: 'judithv.sanchezc@gmail.com'},
				expires: '2024-12-31',
			},
			status: 'authenticated',
			update: vi.fn(),
		});

		// Mock admin user
		mockIsBootstrapAdmin.mockReturnValue(true);

		mockFetch.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockDashboardData),
		} as Response);

		await act(async () => {
			render(<AdminDashboard />);
		});

		await waitFor(() => {
			expect(
				screen.getByRole('heading', {name: /admin dashboard/i}),
			).toBeInTheDocument();
		});

		// Check system health display
		expect(
			screen.getByRole('heading', {name: /system health/i}),
		).toBeInTheDocument();
		expect(screen.getByText(/healthy/i)).toBeInTheDocument();

		// Check recent activity
		expect(
			screen.getByRole('heading', {name: /recent activity/i}),
		).toBeInTheDocument();
		expect(screen.getByText('45')).toBeInTheDocument(); // saved jobs count

		// Check token usage
		expect(
			screen.getByRole('heading', {name: /token usage/i}),
		).toBeInTheDocument();
		expect(screen.getByText('15,000')).toBeInTheDocument(); // total tokens

		// Check company stats
		expect(
			screen.getByRole('heading', {name: /company stats/i}),
		).toBeInTheDocument();
		expect(screen.getByText('90%')).toBeInTheDocument(); // success rate
	});

	it('should handle API errors gracefully', async () => {
		mockUseSession.mockReturnValue({
			data: {
				user: {email: 'judithv.sanchezc@gmail.com'},
				expires: '2024-12-31',
			},
			status: 'authenticated',
			update: vi.fn(),
		});

		// Mock admin user
		mockIsBootstrapAdmin.mockReturnValue(true);

		mockFetch.mockResolvedValue({
			ok: false,
			status: 500,
			json: () => Promise.resolve({error: 'Internal server error'}),
		} as Response);

		await act(async () => {
			render(<AdminDashboard />);
		});

		await waitFor(() => {
			expect(
				screen.getByText(/error loading dashboard data/i),
			).toBeInTheDocument();
		});
	});

	it('should call the correct API endpoint', async () => {
		mockUseSession.mockReturnValue({
			data: {
				user: {email: 'judithv.sanchezc@gmail.com'},
				expires: '2024-12-31',
			},
			status: 'authenticated',
			update: vi.fn(),
		});

		// Mock admin user
		mockIsBootstrapAdmin.mockReturnValue(true);

		mockFetch.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockDashboardData),
		} as Response);

		await act(async () => {
			render(<AdminDashboard />);
		});

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith('/api/admin/dashboard');
		});
	});

	it('should display navigation elements', async () => {
		mockUseSession.mockReturnValue({
			data: {
				user: {email: 'judithv.sanchezc@gmail.com'},
				expires: '2024-12-31',
			},
			status: 'authenticated',
			update: vi.fn(),
		});

		// Mock admin user
		mockIsBootstrapAdmin.mockReturnValue(true);

		mockFetch.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockDashboardData),
		} as Response);

		await act(async () => {
			render(<AdminDashboard />);
		});

		await waitFor(() => {
			expect(
				screen.getByRole('heading', {name: /admin dashboard/i}),
			).toBeInTheDocument();
		});

		// Check for navigation elements
		expect(screen.getByRole('navigation')).toBeInTheDocument();
		// Check for main dashboard heading
		expect(
			screen.getByRole('heading', {name: /admin dashboard/i}),
		).toBeInTheDocument();
	});
});
