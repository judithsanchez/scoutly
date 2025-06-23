import {describe, it, expect, vi, beforeEach} from 'vitest';
import {User} from '@/models/User';
import {AdminUser} from '@/models/AdminUser';
import {developmentAuthOptions} from '../auth.development';

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

// Mock User model
vi.mock('@/models/User', () => ({
	User: {
		findOne: vi.fn(),
		create: vi.fn(),
	},
}));

// Mock AdminUser model
vi.mock('@/models/AdminUser', () => ({
	AdminUser: {
		findOne: vi.fn(),
		create: vi.fn(),
	},
}));

describe('Development Auth Configuration', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('signIn callback', () => {
		it('should auto-approve any user in development mode', async () => {
			const signInCallback = developmentAuthOptions.callbacks?.signIn;
			expect(signInCallback).toBeDefined();

			const result = await signInCallback!({
				user: {email: 'anyone@example.com', id: 'user-id'},
				account: {
					provider: 'google',
					type: 'oauth',
					providerAccountId: 'google-id',
				},
				profile: {email: 'anyone@example.com'},
			});

			expect(result).toBe(true);
		});

		it('should auto-create user if they do not exist', async () => {
			vi.mocked(User.findOne).mockResolvedValue(null);
			vi.mocked(User.create).mockResolvedValue([
				{
					email: 'newuser@example.com',
					candidateInfo: {name: 'New User'},
					cvUrl: 'dev-mock-cv-url',
				},
			]);

			const signInCallback = developmentAuthOptions.callbacks?.signIn;
			const result = await signInCallback!({
				user: {email: 'newuser@example.com', id: 'user-id', name: 'New User'},
				account: {
					provider: 'google',
					type: 'oauth',
					providerAccountId: 'google-id',
				},
				profile: {email: 'newuser@example.com', name: 'New User'},
			});

			expect(result).toBe(true);
			expect(User.create).toHaveBeenCalledWith({
				email: 'newuser@example.com',
				candidateInfo: {
					name: 'New User',
					email: 'newuser@example.com',
				},
				cvUrl: 'dev-mock-cv-url',
				preferences: {
					jobTypes: [],
					locations: [],
					salaryRange: {min: 0, max: 200000},
				},
			});
		});
	});

	describe('session callback', () => {
		it('should enrich session with mock development data', async () => {
			vi.mocked(User.findOne).mockResolvedValue({
				email: 'dev@example.com',
				cvUrl: 'dev-mock-cv-url',
				candidateInfo: {name: 'Dev User'},
			});

			vi.mocked(AdminUser.findOne).mockResolvedValue(null);

			const sessionCallback = developmentAuthOptions.callbacks?.session;
			const result = await sessionCallback!({
				session: {
					user: {
						email: 'dev@example.com',
						isAdmin: false,
						hasCompleteProfile: true,
					},
					expires: '2024-12-31',
				},
				token: {email: 'dev@example.com'},
			} as any);

			expect(result.user).toEqual({
				email: 'dev@example.com',
				isAdmin: false,
				hasCompleteProfile: true, // Always true in dev
				cvUrl: 'dev-mock-cv-url',
			});
		});
	});
});
