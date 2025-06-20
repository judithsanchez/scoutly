import {describe, it, expect, vi, beforeEach} from 'vitest';
import {POST, GET} from '../route';
import {NextRequest} from 'next/server';
import {UserService} from '@/services/userService';
import {SavedJobService} from '@/services/savedJobService';
import dbConnect from '@/middleware/database';

vi.mock('@/services/userService');
vi.mock('@/services/savedJobService');
vi.mock('@/middleware/database');
vi.mock('@/utils/enhancedLogger', () => ({
	EnhancedLogger: {
		getLogger: vi.fn().mockReturnValue({
			info: vi.fn(),
			error: vi.fn(),
			warn: vi.fn(),
			debug: vi.fn(),
		}),
	},
}));

const mockUserService = vi.mocked(UserService);
const mockSavedJobService = vi.mocked(SavedJobService);
const mockDbConnect = vi.mocked(dbConnect);

describe('/api/users', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDbConnect.mockResolvedValue({} as any);
		// Mock SavedJobService to return empty arrays for all users
		mockSavedJobService.getSavedJobsByUserId.mockResolvedValue([]);
	});

	describe('POST /api/users', () => {
		it('should create a new user successfully', async () => {
			const mockUser = {
				_id: '507f1f77bcf86cd799439011',
				email: 'test@example.com',
				createdAt: new Date('2023-01-01T00:00:00.000Z'),
				updatedAt: new Date('2023-01-01T00:00:00.000Z'),
			};

			mockUserService.getOrCreateUser.mockResolvedValue(mockUser as any);

			const request = new NextRequest('http://localhost:3000/api/users', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({email: 'test@example.com'}),
			});

			const response = await POST(request);
			const responseData = await response.json();

			expect(response.status).toBe(200);
			expect(responseData).toEqual({
				success: true,
				user: {
					_id: '507f1f77bcf86cd799439011',
					email: 'test@example.com',
					createdAt: '2023-01-01T00:00:00.000Z',
					updatedAt: '2023-01-01T00:00:00.000Z',
				},
				message: 'User registered successfully',
			});
			expect(mockDbConnect).toHaveBeenCalledOnce();
			expect(mockUserService.getOrCreateUser).toHaveBeenCalledWith(
				'test@example.com',
				undefined,
				undefined,
			);
		});

		it('should return existing user if already exists', async () => {
			const existingUser = {
				_id: '507f1f77bcf86cd799439011',
				email: 'existing@example.com',
				createdAt: new Date('2023-01-01T00:00:00.000Z'),
				updatedAt: new Date('2023-01-01T00:00:00.000Z'),
			};

			mockUserService.getOrCreateUser.mockResolvedValue(existingUser as any);

			const request = new NextRequest('http://localhost:3000/api/users', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({email: 'existing@example.com'}),
			});

			const response = await POST(request);
			const responseData = await response.json();

			expect(response.status).toBe(200);
			expect(responseData.success).toBe(true);
			expect(responseData.user.email).toBe('existing@example.com');
			expect(mockUserService.getOrCreateUser).toHaveBeenCalledWith(
				'existing@example.com',
				undefined,
				undefined,
			);
		});
	});

	describe('GET /api/users', () => {
		it('should return all users successfully', async () => {
			const mockUsers = [
				{
					_id: '507f1f77bcf86cd799439011',
					id: '507f1f77bcf86cd799439011',
					email: 'user1@example.com',
					createdAt: new Date('2023-01-01T00:00:00.000Z'),
					updatedAt: new Date('2023-01-01T00:00:00.000Z'),
					toObject: function () {
						return {
							_id: this._id,
							email: this.email,
							createdAt: this.createdAt,
							updatedAt: this.updatedAt,
						};
					},
				},
				{
					_id: '507f1f77bcf86cd799439012',
					id: '507f1f77bcf86cd799439012',
					email: 'user2@example.com',
					createdAt: new Date('2023-01-02T00:00:00.000Z'),
					updatedAt: new Date('2023-01-02T00:00:00.000Z'),
					toObject: function () {
						return {
							_id: this._id,
							email: this.email,
							createdAt: this.createdAt,
							updatedAt: this.updatedAt,
						};
					},
				},
			];

			mockUserService.getAllUsers.mockResolvedValue(mockUsers as any);

			const request = new NextRequest('http://localhost:3000/api/users', {
				method: 'GET',
			});

			const response = await GET(request);
			const responseData = await response.json();

			expect(response.status).toBe(200);
			expect(responseData).toEqual({
				users: [
					{
						_id: '507f1f77bcf86cd799439011',
						email: 'user1@example.com',
						createdAt: '2023-01-01T00:00:00.000Z',
						updatedAt: '2023-01-01T00:00:00.000Z',
						savedJobs: [],
					},
					{
						_id: '507f1f77bcf86cd799439012',
						email: 'user2@example.com',
						createdAt: '2023-01-02T00:00:00.000Z',
						updatedAt: '2023-01-02T00:00:00.000Z',
						savedJobs: [],
					},
				],
			});
			expect(mockDbConnect).toHaveBeenCalledOnce();
			expect(mockUserService.getAllUsers).toHaveBeenCalledOnce();
			expect(mockSavedJobService.getSavedJobsByUserId).toHaveBeenCalledTimes(2);
			expect(mockSavedJobService.getSavedJobsByUserId).toHaveBeenCalledWith(
				'507f1f77bcf86cd799439011',
			);
			expect(mockSavedJobService.getSavedJobsByUserId).toHaveBeenCalledWith(
				'507f1f77bcf86cd799439012',
			);
		});

		it('should return empty array when no users exist', async () => {
			mockUserService.getAllUsers.mockResolvedValue([]);

			const request = new NextRequest('http://localhost:3000/api/users', {
				method: 'GET',
			});

			const response = await GET(request);
			const responseData = await response.json();

			expect(response.status).toBe(200);
			expect(responseData).toEqual({
				users: [],
			});
			expect(mockUserService.getAllUsers).toHaveBeenCalledOnce();
			// SavedJobService should not be called when there are no users
			expect(mockSavedJobService.getSavedJobsByUserId).not.toHaveBeenCalled();
		});
	});
});
