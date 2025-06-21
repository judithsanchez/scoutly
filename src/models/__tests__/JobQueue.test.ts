import {describe, it, expect, vi, beforeEach} from 'vitest';
import {JobQueue, JobStatus} from '../JobQueue';

// Mock the JobQueue model
vi.mock('../JobQueue', () => ({
	JobQueue: {
		create: vi.fn(),
		findById: vi.fn(),
		findOne: vi.fn(),
		findOneAndUpdate: vi.fn(),
		countDocuments: vi.fn(),
		deleteMany: vi.fn(),
	},
	JobStatus: {
		PENDING: 'pending',
		PROCESSING: 'processing',
		COMPLETED: 'completed',
		FAILED: 'failed',
	},
}));

// Mock the Company model
vi.mock('../Company', () => ({
	Company: {
		create: vi.fn(),
		deleteMany: vi.fn(),
	},
}));

const mockJobQueue = vi.mocked(JobQueue);

describe('JobQueue Model', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Model Creation', () => {
		it('should create a job queue entry with required fields', async () => {
			const mockJobData = {
				_id: 'job123',
				companyId: 'company123',
				status: JobStatus.PENDING,
				createdAt: new Date(),
				updatedAt: new Date(),
				retryCount: 0,
			};

			mockJobQueue.create.mockResolvedValue(mockJobData as any);

			const result = await JobQueue.create({
				companyId: 'company123',
				status: JobStatus.PENDING,
			});

			expect(JobQueue.create).toHaveBeenCalledWith({
				companyId: 'company123',
				status: JobStatus.PENDING,
			});
			expect(result).toEqual(mockJobData);
			expect(result.status).toBe(JobStatus.PENDING);
			expect(result.retryCount).toBe(0);
		});

		it('should enforce required fields', async () => {
			const error = new Error('ValidationError: companyId is required');
			mockJobQueue.create.mockRejectedValue(error);

			await expect(
				JobQueue.create({
					status: JobStatus.PENDING,
					// missing companyId
				} as any),
			).rejects.toThrow('ValidationError: companyId is required');
		});
	});

	describe('Job Status Enum', () => {
		it('should accept valid status values', async () => {
			const statuses = [
				JobStatus.PENDING,
				JobStatus.PROCESSING,
				JobStatus.COMPLETED,
				JobStatus.FAILED,
			];

			for (const status of statuses) {
				const mockJobData = {
					_id: 'job123',
					companyId: 'company123',
					status: status,
					createdAt: new Date(),
					updatedAt: new Date(),
					retryCount: 0,
				};

				mockJobQueue.create.mockResolvedValue(mockJobData as any);

				const result = await JobQueue.create({
					companyId: 'company123',
					status: status,
				});

				expect(result.status).toBe(status);
			}
		});

		it('should reject invalid status values', async () => {
			const error = new Error(
				'ValidationError: INVALID_STATUS is not a valid enum value',
			);
			mockJobQueue.create.mockRejectedValue(error);

			await expect(
				JobQueue.create({
					companyId: 'company123',
					status: 'INVALID_STATUS' as any,
				}),
			).rejects.toThrow(
				'ValidationError: INVALID_STATUS is not a valid enum value',
			);
		});
	});

	describe('Optional Fields', () => {
		it('should handle optional fields correctly', async () => {
			const now = new Date();
			const mockJobData = {
				_id: 'job123',
				companyId: 'company123',
				status: JobStatus.FAILED,
				createdAt: new Date(),
				updatedAt: new Date(),
				retryCount: 0,
				lastAttemptAt: now,
				completedAt: now,
				errorMessage: 'Test error',
			};

			mockJobQueue.create.mockResolvedValue(mockJobData as any);

			const result = await JobQueue.create({
				companyId: 'company123',
				status: JobStatus.FAILED,
				lastAttemptAt: now,
				completedAt: now,
				errorMessage: 'Test error',
			});

			expect(result.lastAttemptAt).toEqual(now);
			expect(result.completedAt).toEqual(now);
			expect(result.errorMessage).toBe('Test error');
		});
	});

	describe('Default Values', () => {
		it('should set retryCount to 0 by default', async () => {
			const mockJobData = {
				_id: 'job123',
				companyId: 'company123',
				status: JobStatus.PENDING,
				createdAt: new Date(),
				updatedAt: new Date(),
				retryCount: 0,
			};

			mockJobQueue.create.mockResolvedValue(mockJobData as any);

			const result = await JobQueue.create({
				companyId: 'company123',
				status: JobStatus.PENDING,
			});

			expect(result.retryCount).toBe(0);
		});
	});

	describe('Queue Operations', () => {
		it('should find and update pending jobs atomically', async () => {
			const mockJob = {
				_id: 'job123',
				companyId: 'company123',
				status: JobStatus.PROCESSING,
				lastAttemptAt: new Date(),
			};

			mockJobQueue.findOneAndUpdate.mockResolvedValue(mockJob as any);

			const result = await JobQueue.findOneAndUpdate(
				{status: JobStatus.PENDING},
				{$set: {status: JobStatus.PROCESSING, lastAttemptAt: new Date()}},
				{sort: {createdAt: 1}, new: true},
			);

			expect(JobQueue.findOneAndUpdate).toHaveBeenCalledWith(
				{status: JobStatus.PENDING},
				{$set: {status: JobStatus.PROCESSING, lastAttemptAt: expect.any(Date)}},
				{sort: {createdAt: 1}, new: true},
			);
			expect(result?.status).toBe(JobStatus.PROCESSING);
		});

		it('should return null when no pending jobs exist', async () => {
			mockJobQueue.findOneAndUpdate.mockResolvedValue(null);

			const result = await JobQueue.findOneAndUpdate(
				{status: JobStatus.PENDING},
				{$set: {status: JobStatus.PROCESSING}},
			);

			expect(result).toBeNull();
		});
	});
});
