import {describe, it, expect, vi, beforeEach} from 'vitest';
import {PATCH, GET} from '../route';
import {User} from '@/models/User';
import {SavedJob, ApplicationStatus} from '@/models/SavedJob';
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

describe('/api/jobs/saved/status', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDbConnect.mockResolvedValue({} as any);

		mockUser.findOne = vi.fn();

		mockSavedJob.findOneAndUpdate = vi.fn();
		mockSavedJob.countDocuments = vi.fn();
		mockSavedJob.find = vi.fn();
	});

	describe('PATCH /api/jobs/saved/status', () => {
		it('should update job status successfully', async () => {
			const mockUserData = {
				_id: '507f1f77bcf86cd799439011',
				email: 'test@example.com',
			};

			const mockUpdatedJob = {
				_id: '507f1f77bcf86cd799439012',
				user: '507f1f77bcf86cd799439011',
				jobTitle: 'Senior Software Engineer',
				jobUrl: 'https://company.com/job1',
				status: ApplicationStatus.APPLIED,
				company: {
					_id: '507f1f77bcf86cd799439013',
					company: 'Tech Corp',
					websiteUrl: 'https://techcorp.com',
					careerPageUrl: 'https://techcorp.com/careers',
					logo: 'https://techcorp.com/logo.png',
					companySize: '100-500',
					industry: 'Technology',
				},
				createdAt: '2023-01-01T00:00:00.000Z',
				updatedAt: '2023-01-01T00:00:00.000Z',
			};

			const requestBody = {
				jobId: '507f1f77bcf86cd799439012',
				status: ApplicationStatus.APPLIED,
				gmail: 'test@example.com',
			};

			(mockUser.findOne as any).mockResolvedValue(mockUserData);

			(mockSavedJob.findOneAndUpdate as any).mockReturnValue({
				populate: vi.fn().mockResolvedValue(mockUpdatedJob),
			});

			const request = new NextRequest(
				'http://localhost:3000/api/jobs/saved/status',
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				},
			);

			const response = await PATCH(request);
			const responseData = await response.json();

			expect(response.status).toBe(200);
			expect(responseData).toEqual(mockUpdatedJob);

			expect(mockDbConnect).toHaveBeenCalledOnce();
			expect(mockUser.findOne).toHaveBeenCalledWith({
				email: 'test@example.com',
			});
			expect(mockSavedJob.findOneAndUpdate).toHaveBeenCalledWith(
				{_id: '507f1f77bcf86cd799439012', user: mockUserData._id},
				{status: ApplicationStatus.APPLIED},
				{new: true},
			);
		});

		it('should return 400 for missing required fields', async () => {
			const requestBody = {
				jobId: '507f1f77bcf86cd799439012',
			};

			const request = new NextRequest(
				'http://localhost:3000/api/jobs/saved/status',
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				},
			);

			const response = await PATCH(request);
			const responseData = await response.json();

			expect(response.status).toBe(400);
			expect(responseData).toEqual({
				error: 'JobId, status, and gmail are required.',
			});
		});

		it('should return 400 for invalid status', async () => {
			const requestBody = {
				jobId: '507f1f77bcf86cd799439012',
				status: 'INVALID_STATUS',
				gmail: 'test@example.com',
			};

			const request = new NextRequest(
				'http://localhost:3000/api/jobs/saved/status',
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				},
			);

			const response = await PATCH(request);
			const responseData = await response.json();

			expect(response.status).toBe(400);
			expect(responseData.error).toContain('Invalid status. Must be one of:');
		});

		it('should return 404 when user is not found', async () => {
			const requestBody = {
				jobId: '507f1f77bcf86cd799439012',
				status: ApplicationStatus.APPLIED,
				gmail: 'nonexistent@example.com',
			};

			(mockUser.findOne as any).mockResolvedValue(null);

			const request = new NextRequest(
				'http://localhost:3000/api/jobs/saved/status',
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				},
			);

			const response = await PATCH(request);
			const responseData = await response.json();

			expect(response.status).toBe(404);
			expect(responseData).toEqual({
				error: 'User not found.',
			});
		});

		it('should return 404 when job is not found', async () => {
			const mockUserData = {
				_id: '507f1f77bcf86cd799439011',
				email: 'test@example.com',
			};

			const requestBody = {
				jobId: '507f1f77bcf86cd799439012',
				status: ApplicationStatus.APPLIED,
				gmail: 'test@example.com',
			};

			(mockUser.findOne as any).mockResolvedValue(mockUserData);

			(mockSavedJob.findOneAndUpdate as any).mockReturnValue({
				populate: vi.fn().mockResolvedValue(null),
			});

			const request = new NextRequest(
				'http://localhost:3000/api/jobs/saved/status',
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				},
			);

			const response = await PATCH(request);
			const responseData = await response.json();

			expect(response.status).toBe(404);
			expect(responseData).toEqual({
				error: 'Job not found.',
			});
		});
	});

	describe('GET /api/jobs/saved/status', () => {
		it('should return jobs with specific status', async () => {
			const mockUserData = {
				_id: '507f1f77bcf86cd799439011',
				email: 'test@example.com',
			};

			const mockSavedJobs = [
				{
					_id: '507f1f77bcf86cd799439012',
					user: '507f1f77bcf86cd799439011',
					jobTitle: 'Senior Software Engineer',
					jobUrl: 'https://company.com/job1',
					status: ApplicationStatus.APPLIED,
					company: {
						_id: '507f1f77bcf86cd799439013',
						company: 'Tech Corp',
						websiteUrl: 'https://techcorp.com',
						careerPageUrl: 'https://techcorp.com/careers',
						logo: 'https://techcorp.com/logo.png',
						companySize: '100-500',
						industry: 'Technology',
					},
					createdAt: '2023-01-01T00:00:00.000Z',
					updatedAt: '2023-01-01T00:00:00.000Z',
				},
			];

			(mockUser.findOne as any).mockResolvedValue(mockUserData);

			(mockSavedJob.countDocuments as any).mockResolvedValue(1);

			const mockQuery = {
				populate: vi.fn().mockReturnThis(),
				sort: vi.fn().mockReturnThis(),
				skip: vi.fn().mockReturnThis(),
				limit: vi.fn().mockReturnThis(),
				exec: vi.fn().mockResolvedValue(mockSavedJobs),
			};
			(mockSavedJob.find as any).mockReturnValue(mockQuery);

			const url = new URL(
				'http://localhost:3000/api/jobs/saved/status?gmail=test@example.com&status=APPLIED&limit=10&offset=0',
			);
			const request = new NextRequest(url);

			const response = await GET(request);
			const responseData = await response.json();

			expect(response.status).toBe(200);
			expect(responseData).toEqual({
				jobs: mockSavedJobs,
				total: 1,
				status: ApplicationStatus.APPLIED,
			});

			expect(mockDbConnect).toHaveBeenCalledOnce();
			expect(mockUser.findOne).toHaveBeenCalledWith({
				email: 'test@example.com',
			});
			expect(mockSavedJob.countDocuments).toHaveBeenCalledWith({
				user: mockUserData._id,
				status: ApplicationStatus.APPLIED,
			});
			expect(mockSavedJob.find).toHaveBeenCalledWith({
				user: mockUserData._id,
				status: ApplicationStatus.APPLIED,
			});
		});

		it('should return 400 for missing required parameters', async () => {
			const url = new URL(
				'http://localhost:3000/api/jobs/saved/status?gmail=test@example.com',
			);

			const request = new NextRequest(url);

			const response = await GET(request);
			const responseData = await response.json();

			expect(response.status).toBe(400);
			expect(responseData).toEqual({
				error: 'Gmail and status parameters are required.',
			});
		});

		it('should return 400 for invalid status parameter', async () => {
			const url = new URL(
				'http://localhost:3000/api/jobs/saved/status?gmail=test@example.com&status=INVALID_STATUS',
			);
			const request = new NextRequest(url);

			const response = await GET(request);
			const responseData = await response.json();

			expect(response.status).toBe(400);
			expect(responseData.error).toContain('Invalid status. Must be one of:');
		});

		it('should return 404 when user is not found', async () => {
			(mockUser.findOne as any).mockResolvedValue(null);

			const url = new URL(
				'http://localhost:3000/api/jobs/saved/status?gmail=nonexistent@example.com&status=APPLIED',
			);
			const request = new NextRequest(url);

			const response = await GET(request);
			const responseData = await response.json();

			expect(response.status).toBe(404);
			expect(responseData).toEqual({
				error: 'User not found.',
			});
		});

		it('should handle pagination parameters correctly', async () => {
			const mockUserData = {
				_id: '507f1f77bcf86cd799439011',
				email: 'test@example.com',
			};

			(mockUser.findOne as any).mockResolvedValue(mockUserData);

			(mockSavedJob.countDocuments as any).mockResolvedValue(25);

			const mockQuery = {
				populate: vi.fn().mockReturnThis(),
				sort: vi.fn().mockReturnThis(),
				skip: vi.fn().mockReturnThis(),
				limit: vi.fn().mockReturnThis(),
				exec: vi.fn().mockResolvedValue([]),
			};
			(mockSavedJob.find as any).mockReturnValue(mockQuery);

			const url = new URL(
				'http://localhost:3000/api/jobs/saved/status?gmail=test@example.com&status=APPLIED&limit=5&offset=20',
			);
			const request = new NextRequest(url);

			const response = await GET(request);

			expect(response.status).toBe(200);
			expect(mockQuery.skip).toHaveBeenCalledWith(20);
			expect(mockQuery.limit).toHaveBeenCalledWith(5);
		});

		it('should use default pagination values when not provided', async () => {
			const mockUserData = {
				_id: '507f1f77bcf86cd799439011',
				email: 'test@example.com',
			};

			(mockUser.findOne as any).mockResolvedValue(mockUserData);

			(mockSavedJob.countDocuments as any).mockResolvedValue(5);

			const mockQuery = {
				populate: vi.fn().mockReturnThis(),
				sort: vi.fn().mockReturnThis(),
				skip: vi.fn().mockReturnThis(),
				limit: vi.fn().mockReturnThis(),
				exec: vi.fn().mockResolvedValue([]),
			};
			(mockSavedJob.find as any).mockReturnValue(mockQuery);

			const url = new URL(
				'http://localhost:3000/api/jobs/saved/status?gmail=test@example.com&status=APPLIED',
			);
			const request = new NextRequest(url);

			const response = await GET(request);

			expect(response.status).toBe(200);
			expect(mockQuery.skip).toHaveBeenCalledWith(0);
			expect(mockQuery.limit).toHaveBeenCalledWith(10);
		});
	});
});
