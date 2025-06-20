import {describe, it, expect, vi, beforeEach} from 'vitest';
import {GET} from '../route';
import {User} from '@/models/User';
import {SavedJob} from '@/models/SavedJob';
import dbConnect from '@/middleware/database';
import {NextRequest} from 'next/server';

vi.mock('@/models/User');
vi.mock('@/models/SavedJob');
vi.mock('@/middleware/database');
vi.mock('@/utils/logger', () => ({
	Logger: vi.fn().mockImplementation(() => ({
		info: vi.fn(),
		error: vi.fn(),
		success: vi.fn(),
	})),
}));

const mockUser = vi.mocked(User);
const mockSavedJob = vi.mocked(SavedJob);
const mockDbConnect = vi.mocked(dbConnect);

describe('/api/jobs/saved', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDbConnect.mockResolvedValue({
			models: {
				User: mockUser,
				SavedJob: mockSavedJob,
			},
		} as any);
	});

	describe('GET /api/jobs/saved', () => {
		it('should return saved jobs for a valid user', async () => {
			const mockUserData = {
				_id: '507f1f77bcf86cd799439011',
				email: 'test@example.com',
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-01T00:00:00.000Z',
			};

			const mockSavedJobs = [
				{
					_id: '507f1f77bcf86cd799439012',
					userId: '507f1f77bcf86cd799439011',
					companyId: {
						_id: '507f1f77bcf86cd799439013',
						company: 'Tech Corp',
						websiteUrl: 'https://techcorp.com',
						careerPageUrl: 'https://techcorp.com/careers',
						logo: 'https://techcorp.com/logo.png',
						companySize: '100-500',
						industry: 'Technology',
					},
					title: 'Senior Software Engineer',
					url: 'https://company.com/job1',
					goodFitReasons: ['Great tech stack'],
					considerationPoints: ['Fast-paced'],
					stretchGoals: ['Leadership'],
					suitabilityScore: 85,
					status: 'saved',
					createdAt: '2023-01-01T00:00:00.000Z',
					updatedAt: '2023-01-01T00:00:00.000Z',
					toObject: () => ({
						_id: '507f1f77bcf86cd799439012',
						userId: '507f1f77bcf86cd799439011',
						companyId: {
							_id: '507f1f77bcf86cd799439013',
							company: 'Tech Corp',
							websiteUrl: 'https://techcorp.com',
							careerPageUrl: 'https://techcorp.com/careers',
							logo: 'https://techcorp.com/logo.png',
							companySize: '100-500',
							industry: 'Technology',
						},
						title: 'Senior Software Engineer',
						url: 'https://company.com/job1',
						goodFitReasons: ['Great tech stack'],
						considerationPoints: ['Fast-paced'],
						stretchGoals: ['Leadership'],
						suitabilityScore: 85,
						status: 'saved',
						createdAt: '2023-01-01T00:00:00.000Z',
						updatedAt: '2023-01-01T00:00:00.000Z',
					}),
				},
			];

			mockUser.findOne.mockResolvedValue(mockUserData as any);

			mockSavedJob.countDocuments.mockResolvedValue(1);

			const mockQuery = {
				populate: vi.fn().mockReturnThis(),
				sort: vi.fn().mockReturnThis(),
				skip: vi.fn().mockReturnThis(),
				limit: vi.fn().mockReturnThis(),
				exec: vi.fn().mockResolvedValue(mockSavedJobs),
			};
			mockSavedJob.find.mockReturnValue(mockQuery as any);

			const url = new URL(
				'http://localhost:3000/api/jobs/saved?gmail=test@example.com&limit=10&offset=0',
			);
			const request = new NextRequest(url);

			const response = await GET(request);

			const responseData = await response.json();

			if (response.status !== 200) {
				console.log('Error response:', responseData);
			}

			expect(response.status).toBe(200);
			expect(responseData).toEqual({
				jobs: [
					{
						_id: '507f1f77bcf86cd799439012',
						userId: '507f1f77bcf86cd799439011',
						companyId: {
							_id: '507f1f77bcf86cd799439013',
							company: 'Tech Corp',
							websiteUrl: 'https://techcorp.com',
							careerPageUrl: 'https://techcorp.com/careers',
							logo: 'https://techcorp.com/logo.png',
							companySize: '100-500',
							industry: 'Technology',
						},
						title: 'Senior Software Engineer',
						url: 'https://company.com/job1',
						goodFitReasons: ['Great tech stack'],
						considerationPoints: ['Fast-paced'],
						stretchGoals: ['Leadership'],
						suitabilityScore: 85,
						status: 'saved',
						createdAt: '2023-01-01T00:00:00.000Z',
						updatedAt: '2023-01-01T00:00:00.000Z',
						// API transformation adds these fields
						user: '507f1f77bcf86cd799439011',
						company: {
							_id: '507f1f77bcf86cd799439013',
							company: 'Tech Corp',
							websiteUrl: 'https://techcorp.com',
							careerPageUrl: 'https://techcorp.com/careers',
							logo: 'https://techcorp.com/logo.png',
							companySize: '100-500',
							industry: 'Technology',
						},
					},
				],
				total: 1,
			});

			expect(mockDbConnect).toHaveBeenCalledOnce();
			expect(mockUser.findOne).toHaveBeenCalledWith({
				email: 'test@example.com',
			});
			expect(mockSavedJob.countDocuments).toHaveBeenCalledWith({
				userId: mockUserData._id,
			});
			expect(mockSavedJob.find).toHaveBeenCalledWith({
				userId: mockUserData._id,
			});
		});

		it('should return 400 when gmail parameter is missing', async () => {
			const url = new URL('http://localhost:3000/api/jobs/saved');
			const request = new NextRequest(url);

			const response = await GET(request);
			const responseData = await response.json();

			expect(response.status).toBe(400);
			expect(responseData).toEqual({
				error: 'Gmail parameter is required.',
			});
		});

		it('should return 404 when user is not found', async () => {
			mockUser.findOne.mockResolvedValue(null);

			const url = new URL(
				'http://localhost:3000/api/jobs/saved?gmail=nonexistent@example.com',
			);
			const request = new NextRequest(url);

			const response = await GET(request);
			const responseData = await response.json();

			expect(response.status).toBe(404);
			expect(responseData).toEqual({
				error: 'User not found.',
			});

			expect(mockUser.findOne).toHaveBeenCalledWith({
				email: 'nonexistent@example.com',
			});
		});

		it('should return empty array when user has no saved jobs', async () => {
			const mockUserData = {
				_id: '507f1f77bcf86cd799439011',
				email: 'test@example.com',
			};

			mockUser.findOne.mockResolvedValue(mockUserData as any);
			mockSavedJob.countDocuments.mockResolvedValue(0);

			const mockQuery = {
				populate: vi.fn().mockReturnThis(),
				sort: vi.fn().mockReturnThis(),
				skip: vi.fn().mockReturnThis(),
				limit: vi.fn().mockReturnThis(),
				exec: vi.fn().mockResolvedValue([]),
			};
			mockSavedJob.find.mockReturnValue(mockQuery as any);

			const url = new URL(
				'http://localhost:3000/api/jobs/saved?gmail=test@example.com',
			);
			const request = new NextRequest(url);

			const response = await GET(request);
			const responseData = await response.json();

			expect(response.status).toBe(200);
			expect(responseData).toEqual({
				jobs: [],
				total: 0,
			});
		});

		it('should handle case-insensitive email lookup', async () => {
			const mockUserData = {
				_id: '507f1f77bcf86cd799439011',
				email: 'test@example.com',
			};

			mockUser.findOne.mockResolvedValue(mockUserData as any);
			mockSavedJob.countDocuments.mockResolvedValue(0);

			const mockQuery = {
				populate: vi.fn().mockReturnThis(),
				sort: vi.fn().mockReturnThis(),
				skip: vi.fn().mockReturnThis(),
				limit: vi.fn().mockReturnThis(),
				exec: vi.fn().mockResolvedValue([]),
			};
			mockSavedJob.find.mockReturnValue(mockQuery as any);

			const url = new URL(
				'http://localhost:3000/api/jobs/saved?gmail=TEST@EXAMPLE.COM',
			);
			const request = new NextRequest(url);

			const response = await GET(request);

			expect(response.status).toBe(200);
			expect(mockUser.findOne).toHaveBeenCalledWith({
				email: 'test@example.com',
			});
		});
	});
});
