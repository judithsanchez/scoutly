import {describe, it, expect, vi, beforeEach} from 'vitest';
import {POST, GET} from '../route';
import {UserService} from '@/services/userService';
import dbConnect from '@/middleware/database';

vi.mock('@/services/userService');
vi.mock('@/middleware/database');
vi.mock('@/utils/logger', () => ({
	Logger: vi.fn().mockImplementation(() => ({
		error: vi.fn(),
	})),
}));

const mockUserService = vi.mocked(UserService);
const mockDbConnect = vi.mocked(dbConnect);

describe('/api/users', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDbConnect.mockResolvedValue({} as any);
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

			const request = new Request('http://localhost:3000/api/users', {
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

			const request = new Request('http://localhost:3000/api/users', {
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
					email: 'user1@example.com',
					createdAt: new Date('2023-01-01T00:00:00.000Z'),
					updatedAt: new Date('2023-01-01T00:00:00.000Z'),
				},
				{
					_id: '507f1f77bcf86cd799439012',
					email: 'user2@example.com',
					createdAt: new Date('2023-01-02T00:00:00.000Z'),
					updatedAt: new Date('2023-01-02T00:00:00.000Z'),
				},
			];

			mockUserService.getAllUsers.mockResolvedValue(mockUsers as any);

			const request = new Request('http://localhost:3000/api/users', {
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
					},
					{
						_id: '507f1f77bcf86cd799439012',
						email: 'user2@example.com',
						createdAt: '2023-01-02T00:00:00.000Z',
						updatedAt: '2023-01-02T00:00:00.000Z',
					},
				],
			});
			expect(mockDbConnect).toHaveBeenCalledOnce();
			expect(mockUserService.getAllUsers).toHaveBeenCalledOnce();
		});

		it('should return empty array when no users exist', async () => {
			mockUserService.getAllUsers.mockResolvedValue([]);

			const request = new Request('http://localhost:3000/api/users', {
				method: 'GET',
			});

			const response = await GET(request);
			const responseData = await response.json();

			expect(response.status).toBe(200);
			expect(responseData).toEqual({
				users: [],
			});
			expect(mockUserService.getAllUsers).toHaveBeenCalledOnce();
		});
	});
});
