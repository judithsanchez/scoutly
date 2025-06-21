import {describe, it, expect, vi, beforeEach} from 'vitest';
import {JobQueue, JobStatus} from '@/models/JobQueue';
import {Company} from '@/models/Company';
import {User} from '@/models/User';
import {executeJobMatchingPipeline} from '@/services/pipeline/JobMatchingPipelineConfig';
import {Logger} from '@/utils/logger';
import {processJob} from '../worker';

// Mock all the dependencies
vi.mock('@/models/JobQueue');
vi.mock('@/models/Company');
vi.mock('@/models/User');
vi.mock('@/services/pipeline/JobMatchingPipelineConfig');
vi.mock('@/utils/logger');

const mockJobQueue = vi.mocked(JobQueue);
const mockCompany = vi.mocked(Company);
const mockUser = vi.mocked(User);
const mockExecuteJobMatchingPipeline = vi.mocked(executeJobMatchingPipeline);
const mockLogger = vi.mocked(Logger);

describe('Scoutly Queue Worker Logic', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should find a pending job and change its status to processing', async () => {
		// Setup: Mock a pending job being found and updated
		const mockJob = {
			_id: 'job123',
			companyId: 'company123',
			status: JobStatus.PENDING,
			createdAt: new Date(),
			lastAttemptAt: null,
		};

		mockJobQueue.findOneAndUpdate.mockResolvedValue(mockJob);

		// Execute: Call the function that finds and updates pending jobs
		const result = await JobQueue.findOneAndUpdate(
			{status: JobStatus.PENDING},
			{$set: {status: JobStatus.PROCESSING, lastAttemptAt: new Date()}},
			{sort: {createdAt: 1}, new: true},
		);

		// Assert: Verify the status update call was made correctly
		expect(mockJobQueue.findOneAndUpdate).toHaveBeenCalledWith(
			{status: JobStatus.PENDING},
			{$set: {status: JobStatus.PROCESSING, lastAttemptAt: expect.any(Date)}},
			{sort: {createdAt: 1}, new: true},
		);
		expect(result).toEqual(mockJob);
	});

	it('should call the pipeline with the correct data', async () => {
		// Setup: Mock job, company, and user data
		const mockJob = {
			_id: 'job123',
			companyId: 'company123',
			status: JobStatus.PROCESSING,
		};

		const mockCompanyData = {
			_id: 'company123',
			company: 'Test Company',
			companyID: 'TEST123',
		};

		const mockUserData = {
			_id: 'user123',
			email: 'judithv.sanchezc@gmail.com',
			cvUrl: 'https://example.com/cv.pdf',
			candidateInfo: {name: 'Test User'},
		};

		const mockLoggerInstance = {
			info: vi.fn(),
			error: vi.fn(),
			success: vi.fn(),
			saveBufferedLogs: vi.fn(),
		};

		mockCompany.findById.mockResolvedValue(mockCompanyData);
		mockUser.findOne.mockResolvedValue(mockUserData);
		mockExecuteJobMatchingPipeline.mockResolvedValue(new Map());
		mockLogger.mockImplementation(() => mockLoggerInstance as any);

		// Execute: Run the worker's main processing function
		await processJob(mockJob, mockLoggerInstance as any);

		// Assert: Verify that pipeline was called with correct data
		expect(mockExecuteJobMatchingPipeline).toHaveBeenCalledWith(
			[mockCompanyData],
			mockUserData.cvUrl,
			mockUserData.candidateInfo,
			mockUserData.email,
		);
	});

	it('should update the Company lastSuccessfulScrape date on success', async () => {
		// Setup: Mock successful pipeline execution
		const mockJob = {
			_id: 'job123',
			companyId: 'company123',
			status: JobStatus.PROCESSING,
		};

		const mockCompanyData = {
			_id: 'company123',
			company: 'Test Company',
			companyID: 'TEST123',
		};

		const mockUserData = {
			_id: 'user123',
			email: 'judithv.sanchezc@gmail.com',
			cvUrl: 'https://example.com/cv.pdf',
			candidateInfo: {name: 'Test User'},
		};

		const mockLoggerInstance = {
			info: vi.fn(),
			error: vi.fn(),
			success: vi.fn(),
			saveBufferedLogs: vi.fn(),
		};

		mockCompany.findById.mockResolvedValue(mockCompanyData);
		mockCompany.updateOne.mockResolvedValue({acknowledged: true} as any);
		mockUser.findOne.mockResolvedValue(mockUserData);
		mockExecuteJobMatchingPipeline.mockResolvedValue(new Map());
		mockLogger.mockImplementation(() => mockLoggerInstance as any);

		// Execute: Run the worker
		await processJob(mockJob, mockLoggerInstance as any);

		// Assert: Verify that Company.updateOne was called with lastSuccessfulScrape
		expect(mockCompany.updateOne).toHaveBeenCalledWith(
			{_id: mockCompanyData._id},
			{$set: {lastSuccessfulScrape: expect.any(Date)}},
		);
	});

	it('should throw an error when company or user is not found', async () => {
		// Setup: Mock missing company
		const mockJob = {
			_id: 'job123',
			companyId: 'company123',
			status: JobStatus.PROCESSING,
		};

		const mockLoggerInstance = {
			info: vi.fn(),
			error: vi.fn(),
			success: vi.fn(),
			saveBufferedLogs: vi.fn(),
		};

		mockCompany.findById.mockResolvedValue(null);
		mockUser.findOne.mockResolvedValue(null);
		mockLogger.mockImplementation(() => mockLoggerInstance as any);

		// Execute & Assert: Should throw an error
		await expect(
			processJob(mockJob, mockLoggerInstance as any),
		).rejects.toThrow('Company or User not found for job');
	});

	it('should handle pipeline execution errors gracefully', async () => {
		// Setup: Mock pipeline to throw an error
		const mockJob = {
			_id: 'job123',
			companyId: 'company123',
			status: JobStatus.PROCESSING,
		};

		const mockCompanyData = {
			_id: 'company123',
			company: 'Test Company',
			companyID: 'TEST123',
		};

		const mockUserData = {
			_id: 'user123',
			email: 'judithv.sanchezc@gmail.com',
			cvUrl: 'https://example.com/cv.pdf',
			candidateInfo: {name: 'Test User'},
		};

		const mockLoggerInstance = {
			info: vi.fn(),
			error: vi.fn(),
			success: vi.fn(),
			saveBufferedLogs: vi.fn(),
		};

		mockCompany.findById.mockResolvedValue(mockCompanyData);
		mockUser.findOne.mockResolvedValue(mockUserData);
		mockExecuteJobMatchingPipeline.mockRejectedValue(
			new Error('Pipeline failed'),
		);
		mockLogger.mockImplementation(() => mockLoggerInstance as any);

		// Execute & Assert: Should propagate the error
		await expect(
			processJob(mockJob, mockLoggerInstance as any),
		).rejects.toThrow('Pipeline failed');
	});
});
