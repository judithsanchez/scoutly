import {describe, it, expect, vi, beforeEach} from 'vitest';
import {LogService} from '../logService';
import {Log, type LogLevel} from '@/models/Log';
import crypto from 'crypto';

interface LogEntry {
	timestamp: Date;
	level: LogLevel;
	message: string;
	context: string;
	data?: Record<string, any>;
	sequence: number;
}

// Mock dependencies
vi.mock('@/models/Log', () => ({
	Log: {
		create: vi.fn(),
	},
}));

vi.mock('crypto', () => ({
	default: {
		randomUUID: vi.fn(),
	},
}));

const mockLog = vi.mocked(Log);
const mockCrypto = vi.mocked(crypto);

describe('LogService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCrypto.randomUUID.mockReturnValue(
			'12345678-1234-1234-1234-123456789012',
		);
	});

	describe('saveBatchedLogs', () => {
		it('should save a batch of logs successfully', async () => {
			const logs = [
				{
					timestamp: new Date('2023-01-01T00:00:00.000Z'),
					level: 'info' as const,
					message: 'Test log 1',
					context: 'test-context',
					sequence: 1,
				},
				{
					timestamp: new Date('2023-01-01T00:00:01.000Z'),
					level: 'error' as const,
					message: 'Test log 2',
					context: 'test-context',
					sequence: 2,
				},
			];

			const expectedBatch = {
				processId: '12345678-1234-1234-1234-123456789012',
				context: 'test-context',
				startTime: logs[0].timestamp,
				endTime: logs[logs.length - 1].timestamp,
				entries: logs.map(entry => ({
					...entry,
					sequence: entry.sequence || 0,
				})),
			};

			mockLog.create.mockResolvedValueOnce(expectedBatch as any);

			const result = await LogService.saveBatchedLogs(logs);

			expect(result).toEqual(expectedBatch);
			expect(mockLog.create).toHaveBeenCalledWith(expectedBatch);
			expect(mockCrypto.randomUUID).toHaveBeenCalledOnce();
		});

		it('should throw error when log batch is empty', async () => {
			await expect(LogService.saveBatchedLogs([])).rejects.toThrow(
				'Cannot save empty log batch',
			);
			expect(mockLog.create).not.toHaveBeenCalled();
		});

		it('should apply sequence fallback in map function', async () => {
			const baseEntry = {
				timestamp: new Date('2023-01-01T00:00:00.000Z'),
				level: 'info' as const,
				message: 'Test log',
				context: 'test-context',
			};

			// Cast to any to allow us to test the map function's fallback
			const logs = [
				{
					...baseEntry,
					sequence: null,
				},
			] as any;

			const expectedBatch = {
				processId: '12345678-1234-1234-1234-123456789012',
				context: 'test-context',
				startTime: baseEntry.timestamp,
				endTime: baseEntry.timestamp,
				entries: [
					{
						...baseEntry,
						sequence: 0,
					},
				],
			};

			mockLog.create.mockResolvedValueOnce(expectedBatch as any);

			const result = await LogService.saveBatchedLogs(logs);

			expect(result).toEqual(expectedBatch);
			expect(mockLog.create).toHaveBeenCalledWith(expectedBatch);
		});
	});
});
