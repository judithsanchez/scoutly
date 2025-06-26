import {describe, it, expect, vi, beforeEach} from 'vitest';
import {authOptions} from '@/lib/auth';
import {User} from '@/models/User';
import {AdminUser} from '@/models/AdminUser';

// Mock dependencies
vi.mock('@/lib/mongodb', () => ({
	default: Promise.resolve({
		db: vi.fn(() => ({
			collection: vi.fn(() => ({
				findOne: vi.fn(),
				insertOne: vi.fn(),
				updateOne: vi.fn(),
				deleteOne: vi.fn(),
			})),
		})),
	}),
	connectToDatabase: vi.fn().mockResolvedValue({}),
}));

// Mock database connection
vi.mock('@/middleware/database', () => ({
	default: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/config/environment', () => ({
	environmentConfig: {
		isDevelopment: true,
		isVercel: false,
		isRaspberryPi: false,
	},
}));

// Mock User model
vi.mock('@/models/User', () => ({
	User: {
		findOne: vi.fn(),
	},
}));

// Mock AdminUser model
vi.mock('@/models/AdminUser', () => ({
	AdminUser: {
		findOne: vi.fn(),
	},
}));

describe('Auth Configuration', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.NEXT_PUBLIC_SKIP_AUTH = 'false';
	});

	describe('signIn callback', () => {
		it('should allow sign-in for pre-approved users', async () => {
			// Mock user exists in database
			vi.mocked(User.findOne).mockResolvedValue({
				email: 'approved@example.com',
				_id: 'user-id',
			});

			const signInCallback = authOptions.callbacks?.signIn;
			expect(signInCallback).toBeDefined();

			const result = await signInCallback!({
				user: {email: 'approved@example.com', id: 'user-id'},
				account: {
					provider: 'google',
					type: 'oauth',
					providerAccountId: 'google-id',
				},
				profile: {email: 'approved@example.com'},
			});

			expect(result).toBe(true);
			expect(User.findOne).toHaveBeenCalledWith({
				email: 'approved@example.com',
			});
		});

		it('should reject sign-in for non-approved users', async () => {
			// Mock user does not exist in database
			vi.mocked(User.findOne).mockResolvedValue(null);

			const signInCallback = authOptions.callbacks?.signIn;
			expect(signInCallback).toBeDefined();

			const result = await signInCallback!({
				user: {email: 'notapproved@example.com', id: 'user-id'},
				account: {
					provider: 'google',
					type: 'oauth',
					providerAccountId: 'google-id',
				},
				profile: {email: 'notapproved@example.com'},
			});

			expect(result).toBe(false);
			expect(User.findOne).toHaveBeenCalledWith({
				email: 'notapproved@example.com',
			});
		});

		it('should handle sign-in errors gracefully', async () => {
			// Mock database error
			vi.mocked(User.findOne).mockRejectedValue(new Error('Database error'));

			const signInCallback = authOptions.callbacks?.signIn;
			expect(signInCallback).toBeDefined();

			const result = await signInCallback!({
				user: {email: 'error@example.com', id: 'user-id'},
				account: {
					provider: 'google',
					type: 'oauth',
					providerAccountId: 'google-id',
				},
				profile: {email: 'error@example.com'},
			});

			expect(result).toBe(false);
		});
	});

	describe('session callback', () => {
		it('should enrich session with user data', async () => {
			// Mock user data
			vi.mocked(User.findOne).mockResolvedValue({
				email: 'user@example.com',
				cvUrl: 'https://example.com/cv.pdf',
				candidateInfo: {name: 'Test User'},
			});
			vi.mocked(AdminUser.findOne).mockResolvedValue({
				email: 'user@example.com',
			});

			const sessionCallback = authOptions.callbacks?.session;
			expect(sessionCallback).toBeDefined();

			const result = await sessionCallback!({
				session: {
					user: {
						email: 'user@example.com',
						isAdmin: false,
						hasCompleteProfile: false,
					},
					expires: '2024-01-01',
				},
				token: {email: 'user@example.com'},
			} as any);

			expect(result.user).toBeDefined();
			if (result.user && 'isAdmin' in result.user) {
				expect(result.user.isAdmin).toBe(true);
				expect(result.user.hasCompleteProfile).toBe(true);
				expect(result.user.cvUrl).toBe('https://example.com/cv.pdf');
			}
		});

		it('should handle incomplete profiles', async () => {
			// Mock user without complete profile
			vi.mocked(User.findOne).mockResolvedValue({
				email: 'user@example.com',
				cvUrl: null,
				candidateInfo: null,
			});
			vi.mocked(AdminUser.findOne).mockResolvedValue(null);

			const sessionCallback = authOptions.callbacks?.session;
			expect(sessionCallback).toBeDefined();

			const result = await sessionCallback!({
				session: {
					user: {
						email: 'user@example.com',
						isAdmin: false,
						hasCompleteProfile: false,
					},
					expires: '2024-01-01',
				},
				token: {email: 'user@example.com'},
			} as any);

			expect(result.user).toBeDefined();
			if (result.user && 'isAdmin' in result.user) {
				expect(result.user.isAdmin).toBe(false);
				expect(result.user.hasCompleteProfile).toBe(false);
			}
		});

		it('should handle session errors gracefully', async () => {
			// Mock database error
			vi.mocked(User.findOne).mockRejectedValue(new Error('Database error'));

			const sessionCallback = authOptions.callbacks?.session;
			expect(sessionCallback).toBeDefined();

			const result = await sessionCallback!({
				session: {
					user: {
						email: 'user@example.com',
						isAdmin: false,
						hasCompleteProfile: false,
					},
					expires: '2024-01-01',
				},
				token: {email: 'user@example.com'},
			} as any);

			expect(result.user).toBeDefined();
			if (result.user && 'isAdmin' in result.user) {
				expect(result.user.isAdmin).toBe(false);
				expect(result.user.hasCompleteProfile).toBe(false);
			}
		});
	});

	describe('jwt callback', () => {
		it('should enrich JWT with user metadata', async () => {
			// Mock user data
			vi.mocked(User.findOne).mockResolvedValue({
				email: 'user@example.com',
				cvUrl: 'https://example.com/cv.pdf',
				candidateInfo: {name: 'Test User'},
			});
			vi.mocked(AdminUser.findOne).mockResolvedValue({
				email: 'user@example.com',
			});

			const jwtCallback = authOptions.callbacks?.jwt;
			expect(jwtCallback).toBeDefined();

			const result = await jwtCallback!({
				token: {email: 'user@example.com'},
				user: {email: 'user@example.com'},
				account: {
					provider: 'google',
					type: 'oauth',
					providerAccountId: 'google-id',
				},
			} as any);

			expect(result.isAdmin).toBe(true);
			expect(result.hasCompleteProfile).toBe(true);
			expect(result.cvUrl).toBe('https://example.com/cv.pdf');
		});
	});
});
