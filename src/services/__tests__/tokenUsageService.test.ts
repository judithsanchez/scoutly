import {describe, it, expect, vi, beforeEach} from 'vitest';
import {TokenUsageService} from '../tokenUsageService';
import {TokenUsage} from '@/models/TokenUsage';
import {Logger} from '@/utils/logger';

// Mock dependencies
enum TokenOperation {
	INITIAL_MATCHING = 'initial_matching',
	DEEP_DIVE_ANALYSIS = 'deep_dive_analysis',
	JOB_BATCH_ANALYSIS = 'job_batch_analysis',
}

vi.mock('@/models/TokenUsage', () => ({
	TokenOperation,
	TokenUsage: {
		create: vi.fn(),
		aggregate: vi.fn(),
	},
}));

vi.mock('@/utils/logger', () => ({
	Logger: vi.fn().mockImplementation(() => ({
		debug: vi.fn(),
		error: vi.fn(),
	})),
}));

const mockTokenUsage = vi.mocked(TokenUsage);

describe('TokenUsageService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('recordUsage', () => {
		it('should record token usage successfully', async () => {
			const usage = {
				processId: 'test-process',
				operation: TokenOperation.INITIAL_MATCHING,
				estimatedTokens: 100,
				actualTokens: 95,
				inputTokens: 50,
				outputTokens: 45,
				costEstimate: {
					input: 0.001,
					output: 0.002,
					total: 0.003,
					currency: 'USD',
					isFreeUsage: false,
				},
				userEmail: 'test@example.com',
				companyId: '12345',
				companyName: 'Test Company',
			};

			const expectedResult = {
				...usage,
				timestamp: expect.any(Date),
			} as any;

			mockTokenUsage.create.mockResolvedValueOnce(expectedResult);

			const result = await TokenUsageService.recordUsage(usage);

			expect(result).toEqual(expectedResult);
			expect(mockTokenUsage.create).toHaveBeenCalledWith(expectedResult);
		});
	});

	describe('getUserStats', () => {
		it('should return user token usage statistics', async () => {
			const mockStats = {
				totalTokens: 1000,
				totalCost: 0.02,
				averageTokensPerCall: 100,
				totalCalls: 10,
				estimationAccuracy: 95.24,
			};

			mockTokenUsage.aggregate.mockResolvedValueOnce([
				{
					_id: null,
					totalTokens: 1000,
					totalCost: 0.02,
					totalCalls: 10,
					totalEstimated: 1050,
					totalActual: 1000,
				},
			]);

			const result = await TokenUsageService.getUserStats('test@example.com');

			expect(result).toEqual(mockStats);
			expect(mockTokenUsage.aggregate).toHaveBeenCalledWith([
				{
					$match: {userEmail: 'test@example.com'},
				},
				expect.any(Object),
			]);
		});

		it('should return default stats when no usage exists', async () => {
			mockTokenUsage.aggregate.mockResolvedValueOnce([]);

			const result = await TokenUsageService.getUserStats('test@example.com');

			expect(result).toEqual({
				totalTokens: 0,
				totalCost: 0,
				averageTokensPerCall: 0,
				totalCalls: 0,
				estimationAccuracy: 100,
			});
		});
	});

	describe('getCompanyStats', () => {
		it('should return company token usage statistics', async () => {
			const mockStats = {
				totalTokens: 2000,
				totalCost: 0.04,
				averageTokensPerCall: 200,
				totalCalls: 10,
				estimationAccuracy: 98.04,
			};

			mockTokenUsage.aggregate.mockResolvedValueOnce([
				{
					_id: null,
					totalTokens: 2000,
					totalCost: 0.04,
					totalCalls: 10,
					totalEstimated: 2040,
					totalActual: 2000,
				},
			]);

			const result = await TokenUsageService.getCompanyStats('12345');

			expect(result).toEqual(mockStats);
			expect(mockTokenUsage.aggregate).toHaveBeenCalledWith([
				{
					$match: {companyId: '12345'},
				},
				expect.any(Object),
			]);
		});
	});

	describe('getOperationStats', () => {
		it('should return operation-specific token usage statistics', async () => {
			const mockStats = {
				totalTokens: 500,
				totalCost: 0.01,
				averageTokensPerCall: 100,
				totalCalls: 5,
				estimationAccuracy: 97.09,
			};

			mockTokenUsage.aggregate.mockResolvedValueOnce([
				{
					_id: null,
					totalTokens: 500,
					totalCost: 0.01,
					totalCalls: 5,
					totalEstimated: 515,
					totalActual: 500,
				},
			]);

			const result = await TokenUsageService.getOperationStats(
				TokenOperation.INITIAL_MATCHING,
			);

			expect(result).toEqual(mockStats);
			expect(mockTokenUsage.aggregate).toHaveBeenCalledWith([
				{
					$match: {operation: TokenOperation.INITIAL_MATCHING},
				},
				expect.any(Object),
			]);
		});
	});
});
