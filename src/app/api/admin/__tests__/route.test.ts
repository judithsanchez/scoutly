/**
 * Tests for admin API routes
 */

import {describe, it, expect, vi, beforeEach} from 'vitest';
import {GET} from '../route';
import {NextRequest} from 'next/server';

// Mock the auth dependency
vi.mock('next-auth', () => ({
	getServerSession: vi.fn(),
}));

// Mock our admin utils
vi.mock('@/utils/adminUtils', () => ({
	isAdminUser: vi.fn(),
}));

// Mock the database models we'll use
vi.mock('@/models/Log');
vi.mock('@/models/TokenUsage');
vi.mock('@/models/CompanyScrapeHistory');
vi.mock('@/models/SavedJob');
vi.mock('@/models/UserCompanyPreference');

describe('Admin API Routes', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('GET /api/admin', () => {
		it('should return 401 for non-authenticated users', async () => {
			const {getServerSession} = await import('next-auth');
			vi.mocked(getServerSession).mockResolvedValue(null);

			const request = new NextRequest('http://localhost:3000/api/admin');
			const response = await GET(request);

			expect(response.status).toBe(401);
			const data = await response.json();
			expect(data.error).toBe('Authentication required');
		});

		it('should return 403 for non-admin users', async () => {
			const {getServerSession} = await import('next-auth');
			const {isAdminUser} = await import('@/utils/adminUtils');

			vi.mocked(getServerSession).mockResolvedValue({
				user: {email: 'user@example.com'},
			} as any);
			vi.mocked(isAdminUser).mockReturnValue(false);

			const request = new NextRequest('http://localhost:3000/api/admin');
			const response = await GET(request);

			expect(response.status).toBe(403);
			const data = await response.json();
			expect(data.error).toBe('Admin access required');
		});

		it('should return admin dashboard data for admin user', async () => {
			const {getServerSession} = await import('next-auth');
			const {isAdminUser} = await import('@/utils/adminUtils');

			vi.mocked(getServerSession).mockResolvedValue({
				user: {email: 'judithv.sanchezc@gmail.com'},
			} as any);
			vi.mocked(isAdminUser).mockReturnValue(true);

			// Mock database queries
			const {Log} = await import('@/models/Log');
			const {TokenUsage} = await import('@/models/TokenUsage');
			const {CompanyScrapeHistory} = await import(
				'@/models/CompanyScrapeHistory'
			);
			const {SavedJob} = await import('@/models/SavedJob');
			const {UserCompanyPreference} = await import(
				'@/models/UserCompanyPreference'
			);

			// Mock recent logs (story logger data)
			vi.mocked(Log.find).mockResolvedValue([
				{
					_id: '1',
					timestamp: new Date(),
					context: 'Pipeline-Complete-Story',
					level: 'info',
					data: {totalSteps: 7, executed: 7},
				},
			] as any);

			// Mock token usage
			vi.mocked(TokenUsage.aggregate).mockResolvedValue([
				{_id: null, totalTokens: 1500, totalCost: 0.05, count: 3},
			] as any);

			// Mock scrape history
			vi.mocked(CompanyScrapeHistory.find).mockResolvedValue([
				{
					companyId: 'company1',
					timestamp: new Date(),
					success: true,
				},
			] as any);

			// Mock saved jobs
			vi.mocked(SavedJob.countDocuments).mockResolvedValue(5);

			// Mock user preferences
			vi.mocked(UserCompanyPreference.countDocuments).mockResolvedValue(2);

			const request = new NextRequest('http://localhost:3000/api/admin');
			const response = await GET(request);

			expect(response.status).toBe(200);
			const data = await response.json();

			expect(data).toHaveProperty('systemOverview');
			expect(data).toHaveProperty('recentStories');
			expect(data).toHaveProperty('tokenUsage');
			expect(data).toHaveProperty('scrapeActivity');
			expect(data.systemOverview).toHaveProperty('totalUsers');
			expect(data.systemOverview).toHaveProperty('totalJobsSaved');
			expect(data.tokenUsage).toHaveProperty('todayTotal');
		});

		it('should handle database errors gracefully', async () => {
			const {getServerSession} = await import('next-auth');
			const {isAdminUser} = await import('@/utils/adminUtils');

			vi.mocked(getServerSession).mockResolvedValue({
				user: {email: 'judithv.sanchezc@gmail.com'},
			} as any);
			vi.mocked(isAdminUser).mockReturnValue(true);

			// Mock database error
			const {Log} = await import('@/models/Log');
			vi.mocked(Log.find).mockRejectedValue(new Error('Database error'));

			const request = new NextRequest('http://localhost:3000/api/admin');
			const response = await GET(request);

			expect(response.status).toBe(500);
			const data = await response.json();
			expect(data.error).toBe('Internal server error');
		});
	});
});
