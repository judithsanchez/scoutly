import {describe, it, expect, vi, beforeEach} from 'vitest';
import {GET} from '../dashboard/route';
import {NextRequest} from 'next/server';

// Mock environment variables
process.env.MONGODB_URI = 'mongodb://test:27017/test';

// Mock the database connection
vi.mock('@/lib/mongodb', () => ({
	connectToDatabase: vi.fn().mockResolvedValue(true),
}));

// Mock next-auth
vi.mock('next-auth/next', () => ({
	getServerSession: vi.fn(),
}));

// Mock the database models
vi.mock('@/models/Log', () => ({
	Log: {
		find: vi.fn().mockReturnValue({
			sort: vi.fn().mockReturnValue({
				limit: vi.fn().mockReturnValue({
					lean: vi.fn().mockResolvedValue([]),
				}),
			}),
		}),
	},
}));

vi.mock('@/models/TokenUsage', () => ({
	TokenUsage: {
		find: vi.fn().mockReturnValue({
			lean: vi.fn().mockResolvedValue([]),
		}),
	},
}));

vi.mock('@/models/CompanyScrapeHistory', () => ({
	CompanyScrapeHistory: {
		find: vi.fn().mockReturnValue({
			sort: vi.fn().mockReturnValue({
				limit: vi.fn().mockReturnValue({
					lean: vi.fn().mockResolvedValue([]),
				}),
			}),
		}),
	},
}));

vi.mock('@/models/SavedJob', () => ({
	SavedJob: {
		countDocuments: vi.fn().mockResolvedValue(0),
	},
}));

vi.mock('@/models/UserCompanyPreference', () => ({
	UserCompanyPreference: {
		countDocuments: vi.fn().mockResolvedValue(0),
	},
}));

// Mock the admin utils
vi.mock('@/utils/adminUtils', () => ({
	isAdminUser: vi.fn(),
}));

describe('Admin Dashboard API', () => {
	let mockRequest: NextRequest;

	beforeEach(() => {
		vi.clearAllMocks();
		mockRequest = new NextRequest('http://localhost:3000/api/admin/dashboard', {
			method: 'GET',
			headers: {
				cookie: 'next-auth.session-token=mock-session',
			},
		});
	});

	describe('GET /api/admin/dashboard', () => {
		it('should return dashboard data for admin user', async () => {
			// Mock admin check
			const {isAdminUser} = await import('@/utils/adminUtils');
			vi.mocked(isAdminUser).mockReturnValue(true);

			// Mock session with admin email
			const {getServerSession} = await import('next-auth/next');
			vi.mocked(getServerSession).mockResolvedValue({
				user: {email: 'judithv.sanchezc@gmail.com'},
			});

			const response = await GET(mockRequest);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toHaveProperty('systemHealth');
			expect(data).toHaveProperty('recentActivity');
			expect(data).toHaveProperty('tokenUsage');
			expect(data).toHaveProperty('companyStats');
		});

		it('should return 403 for non-admin user', async () => {
			// Mock non-admin check
			const {isAdminUser} = await import('@/utils/adminUtils');
			vi.mocked(isAdminUser).mockReturnValue(false);

			// Mock session with non-admin email
			const {getServerSession} = await import('next-auth/next');
			vi.mocked(getServerSession).mockResolvedValue({
				user: {email: 'user@example.com'},
			});

			const response = await GET(mockRequest);

			expect(response.status).toBe(403);
		});

		it('should return 401 for unauthenticated user', async () => {
			// Mock no session
			const {getServerSession} = await import('next-auth/next');
			vi.mocked(getServerSession).mockResolvedValue(null);

			const response = await GET(mockRequest);

			expect(response.status).toBe(401);
		});

		it('should handle database errors gracefully', async () => {
			// Mock admin check
			const {isAdminUser} = await import('@/utils/adminUtils');
			vi.mocked(isAdminUser).mockReturnValue(true);

			// Mock session
			const {getServerSession} = await import('next-auth/next');
			vi.mocked(getServerSession).mockResolvedValue({
				user: {email: 'judithv.sanchezc@gmail.com'},
			});

			// Mock database error
			const {Log} = await import('@/models/Log');
			vi.mocked(Log.find).mockImplementation(() => {
				throw new Error('Database connection failed');
			});

			const response = await GET(mockRequest);

			expect(response.status).toBe(500);
		});
	});
});
