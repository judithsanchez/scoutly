import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';

vi.mock('../../services/logService', () => ({
	LogService: {
		saveBatchedLogs: vi.fn().mockResolvedValue(undefined),
	},
}));

const mockConsole = {
	debug: vi.fn(),
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	log: vi.fn(),
};

const originalConsole = {
	debug: console.debug,
	info: console.info,
	warn: console.warn,
	error: console.error,
	log: console.log,
};

import {Logger} from '../logger';
import {LogService} from '../../services/logService';

describe('Logger', () => {
	let logger: Logger;

	beforeEach(() => {
		vi.clearAllMocks();

		console.debug = mockConsole.debug;
		console.info = mockConsole.info;
		console.warn = mockConsole.warn;
		console.error = mockConsole.error;
		console.log = mockConsole.log;

		logger = new Logger('TestContext');
	});

	afterEach(() => {
		console.debug = originalConsole.debug;
		console.info = originalConsole.info;
		console.warn = originalConsole.warn;
		console.error = originalConsole.error;
		console.log = originalConsole.log;
	});

	it('should create a logger with default options', () => {
		const testLogger = new Logger('TestApp');

		expect(testLogger).toBeDefined();
		expect(testLogger).toBeInstanceOf(Logger);
	});

	it('should log debug messages to console', async () => {
		const message = 'This is a debug message';
		const data = {key: 'value'};

		await logger.debug(message, data);

		expect(mockConsole.debug).toHaveBeenCalledOnce();
		expect(mockConsole.log).toHaveBeenCalledWith(data);

		const debugCall = mockConsole.debug.mock.calls[0][0];
		expect(debugCall).toContain('🔍');
		expect(debugCall).toContain('[TestContext]');
		expect(debugCall).toContain(message);
	});

	it('should log info messages to console', async () => {
		const message = 'This is an info message';

		await logger.info(message);

		expect(mockConsole.info).toHaveBeenCalledOnce();

		const infoCall = mockConsole.info.mock.calls[0][0];
		expect(infoCall).toContain('ℹ️');
		expect(infoCall).toContain('[TestContext]');
		expect(infoCall).toContain(message);
	});

	it('should log warning messages to console', async () => {
		const message = 'This is a warning message';

		await logger.warn(message);

		expect(mockConsole.warn).toHaveBeenCalledOnce();

		const warnCall = mockConsole.warn.mock.calls[0][0];
		expect(warnCall).toContain('⚠️');
		expect(warnCall).toContain('[TestContext]');
		expect(warnCall).toContain(message);
	});

	it('should log error messages to console', async () => {
		const message = 'This is an error message';
		const error = new Error('Test error');

		await logger.error(message, error);

		expect(mockConsole.error).toHaveBeenCalledTimes(2);

		const errorCall = mockConsole.error.mock.calls[0][0];
		expect(errorCall).toContain('❌');
		expect(errorCall).toContain('[TestContext]');
		expect(errorCall).toContain(message);
		expect(mockConsole.error.mock.calls[1][0]).toBe(error);
	});

	it('should log success messages to console', async () => {
		const message = 'This is a success message';

		await logger.success(message);

		expect(mockConsole.log).toHaveBeenCalledOnce();

		const successCall = mockConsole.log.mock.calls[0][0];
		expect(successCall).toContain('✅');
		expect(successCall).toContain('[TestContext]');
		expect(successCall).toContain(message);
	});

	it('should buffer logs for database storage', async () => {
		const message1 = 'First message';
		const message2 = 'Second message';

		await logger.info(message1);
		await logger.debug(message2);

		expect(LogService.saveBatchedLogs).not.toHaveBeenCalled();
	});

	it('should save buffered logs to database', async () => {
		const message1 = 'First message';
		const message2 = 'Second message';

		await logger.info(message1);
		await logger.debug(message2);

		await logger.saveBufferedLogs();

		expect(LogService.saveBatchedLogs).toHaveBeenCalledOnce();

		const savedLogs = vi.mocked(LogService.saveBatchedLogs).mock.calls[0][0];
		expect(savedLogs).toHaveLength(2);
		expect(savedLogs[0]).toMatchObject({
			level: 'info',
			message: message1,
			context: 'TestContext',
			sequence: 0,
		});
		expect(savedLogs[1]).toMatchObject({
			level: 'debug',
			message: message2,
			context: 'TestContext',
			sequence: 1,
		});
	});

	it('should handle empty buffer when saving logs', async () => {
		await logger.saveBufferedLogs();

		expect(LogService.saveBatchedLogs).not.toHaveBeenCalled();
	});

	it('should create logger with custom options', async () => {
		const customLogger = new Logger('CustomContext', {
			emoji: false,
			timestamp: false,
			color: false,
		});

		await customLogger.info('Test message');

		expect(mockConsole.info).toHaveBeenCalledOnce();

		const infoCall = mockConsole.info.mock.calls[0][0];
		expect(infoCall).not.toContain('ℹ️');
		expect(infoCall).not.toContain('[2');
		expect(infoCall).toContain('[CustomContext]');
		expect(infoCall).toContain('Test message');
	});

	it('should include caller information in log messages', async () => {
		await logger.info('Test with caller info');

		expect(mockConsole.info).toHaveBeenCalledOnce();

		const infoCall = mockConsole.info.mock.calls[0][0];
		expect(infoCall).toContain('[TestContext]');
		expect(infoCall).toContain('Test with caller info');
		expect(infoCall).toMatch(/@\w+/);
	});

	it('should handle database save errors gracefully', async () => {
		vi.mocked(LogService.saveBatchedLogs).mockRejectedValueOnce(
			new Error('DB Error'),
		);
		await logger.info('Test message');

		await expect(logger.saveBufferedLogs()).resolves.toBeUndefined();

		expect(mockConsole.error).toHaveBeenCalledWith(
			'[Logger DB] Failed to save buffered logs:',
			expect.any(Error),
		);
	});

	it('should increment sequence numbers for buffered logs', async () => {
		await logger.info('First');
		await logger.warn('Second');
		await logger.error('Third');
		await logger.saveBufferedLogs();

		const savedLogs = vi.mocked(LogService.saveBatchedLogs).mock.calls[0][0];
		expect(savedLogs[0].sequence).toBe(0);
		expect(savedLogs[1].sequence).toBe(1);
		expect(savedLogs[2].sequence).toBe(2);
	});
});
