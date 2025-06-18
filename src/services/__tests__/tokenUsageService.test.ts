import {describe, it, expect, vi, beforeEach} from 'vitest';
import type {Document} from 'mongoose';

// Mock modules BEFORE importing them
vi.mock('@/models/TokenUsage', () => ({
	TokenOperation: {
		INITIAL_MATCHING: 'initial_matching',
		DEEP_DIVE_ANALYSIS: 'deep_dive_analysis',
		JOB_BATCH_ANALYSIS: 'job_batch_analysis',
	},
	TokenUsage: {
		create: vi
			.fn()
			.mockImplementation(doc => Promise.resolve({...doc, _id: 'mock-id'})),
		aggregate: vi.fn(),
	},
}));

vi.mock('@/utils/logger', () => ({
	Logger: vi.fn().mockImplementation(() => ({
		debug: vi.fn(),
		error: vi.fn(),
	})),
}));

// Now import the actual modules
import {TokenUsageService} from '../tokenUsageService';
import {TokenUsage} from '@/models/TokenUsage';

// Mock TokenOperation enum - must match the actual enum values
enum TokenOperation {
	INITIAL_MATCHING = 'initial_matching',
	DEEP_DIVE_ANALYSIS = 'deep_dive_analysis',
	JOB_BATCH_ANALYSIS = 'job_batch_analysis',
}

interface TokenAggregateResult {
	_id: null;
	totalTokens: number;
	totalCost: number;
	totalCalls: number;
	totalEstimated: number;
	totalActual: number;
}

interface MockTokenUsageDocument extends Document {
	processId: string;
	operation: TokenOperation;
	timestamp: Date;
	estimatedTokens: number;
	actualTokens: number;
	inputTokens: number;
	outputTokens: number;
	costEstimate: {
		input: number;
		output: number;
		total: number;
		currency: string;
		isFreeUsage: boolean;
	};
	userEmail: string;
	companyId: string;
	companyName: string;
}

vi.mock('@/models/TokenUsage', () => ({
	TokenOperation: {
		INITIAL_MATCHING: 'initial_matching',
		DEEP_DIVE_ANALYSIS: 'deep_dive_analysis',
		JOB_BATCH_ANALYSIS: 'job_batch_analysis',
	},
	TokenUsage: {
		create: vi
			.fn()
			.mockImplementation(doc => Promise.resolve({...doc, _id: 'mock-id'})),
		aggregate: vi.fn(),
	},
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
				_id: 'mock-id',
			};

			const result = await TokenUsageService.recordUsage(usage);

			expect(result).toEqual(expectedResult);
			expect(mockTokenUsage.create).toHaveBeenCalledWith({
				...usage,
				timestamp: expect.any(Date),
			});
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
				} as TokenAggregateResult,
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
				} as TokenAggregateResult,
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
				} as TokenAggregateResult,
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
