import {describe, it, expect, vi, beforeEach} from 'vitest';
import {UserService} from '../userService';
import {User} from '@/models/User';
import {Logger} from '@/utils/logger';

vi.mock('@/models/User', () => ({
	User: {
		findOne: vi.fn(),
		find: vi.fn(),
		create: vi.fn(),
	},
}));

vi.mock('@/utils/logger', () => ({
	Logger: vi.fn().mockImplementation(() => ({
		info: vi.fn(),
	})),
}));

const mockUser = vi.mocked(User);

describe('UserService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getOrCreateUser', () => {
		it('should return existing user if found', async () => {
			const existingUser = {
				_id: '507f1f77bcf86cd799439011',
				email: 'test@example.com',
				createdAt: new Date('2023-01-01T00:00:00.000Z'),
				updatedAt: new Date('2023-01-01T00:00:00.000Z'),
			} as any;

			mockUser.findOne.mockResolvedValueOnce(existingUser as any);

			const result = await UserService.getOrCreateUser('test@example.com');

			expect(result).toEqual(existingUser);
			expect(mockUser.findOne).toHaveBeenCalledWith({
				email: 'test@example.com',
			});
			expect(mockUser.create).not.toHaveBeenCalled();
		});

		it('should create new user if not found', async () => {
			const newUser = {
				_id: '507f1f77bcf86cd799439012',
				email: 'new@example.com',
				createdAt: new Date('2023-01-01T00:00:00.000Z'),
				updatedAt: new Date('2023-01-01T00:00:00.000Z'),
			} as any;

			mockUser.findOne.mockResolvedValueOnce(null);
			mockUser.create.mockResolvedValueOnce(newUser as any);

			const result = await UserService.getOrCreateUser('new@example.com');

			expect(result).toEqual(newUser);
			expect(mockUser.findOne).toHaveBeenCalledWith({email: 'new@example.com'});
			expect(mockUser.create).toHaveBeenCalledWith({email: 'new@example.com'});
		});
	});

	describe('getUserByEmail', () => {
		it('should return user when found', async () => {
			const user = {
				_id: '507f1f77bcf86cd799439013',
				email: 'test@example.com',
				createdAt: new Date('2023-01-01T00:00:00.000Z'),
				updatedAt: new Date('2023-01-01T00:00:00.000Z'),
			} as any;

			mockUser.findOne.mockResolvedValueOnce(user as any);

			const result = await UserService.getUserByEmail('test@example.com');

			expect(result).toEqual(user);
			expect(mockUser.findOne).toHaveBeenCalledWith({
				email: 'test@example.com',
			});
		});

		it('should return null when user not found', async () => {
			mockUser.findOne.mockResolvedValueOnce(null);

			const result = await UserService.getUserByEmail(
				'nonexistent@example.com',
			);

			expect(result).toBeNull();
			expect(mockUser.findOne).toHaveBeenCalledWith({
				email: 'nonexistent@example.com',
			});
		});
	});

	describe('getAllUsers', () => {
		it('should return all users', async () => {
			const users = [
				{
					_id: '507f1f77bcf86cd799439014',
					email: 'user1@example.com',
					createdAt: new Date('2023-01-01T00:00:00.000Z'),
					updatedAt: new Date('2023-01-01T00:00:00.000Z'),
				} as any,
				{
					_id: '507f1f77bcf86cd799439015',
					email: 'user2@example.com',
					createdAt: new Date('2023-01-02T00:00:00.000Z'),
					updatedAt: new Date('2023-01-02T00:00:00.000Z'),
				} as any,
			];

			mockUser.find.mockResolvedValueOnce(users as any[]);

			const result = await UserService.getAllUsers();

			expect(result).toEqual(users);
			expect(mockUser.find).toHaveBeenCalledOnce();
		});

		it('should return empty array when no users exist', async () => {
			mockUser.find.mockResolvedValueOnce([]);

			const result = await UserService.getAllUsers();

			expect(result).toEqual([]);
			expect(mockUser.find).toHaveBeenCalledOnce();
		});
	});
});
