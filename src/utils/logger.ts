import {LogService} from '../services/logService';
import type {LogLevel, ILog} from '../models/Log';

interface BufferedLog {
	timestamp: Date;
	level: LogLevel;
	message: string;
	context: string;
	data?: Record<string, any>;
	sequence: number;
}

interface LogOptions {
	emoji?: boolean;
	timestamp?: boolean;
	prefix?: string;
	color?: boolean;
	stackDepth?: number; // How many stack frames to include
}

interface LogMetadata {
	functionName?: string;
	lineNumber?: number;
	fileName?: string;
	stackTrace?: string[];
}

function getCallerInfo(depth: number = 1): LogMetadata {
	const stack = new Error().stack?.split('\n').slice(3); // Skip Error and Logger frames
	if (!stack) return {};

	const callerFrame = stack[depth];
	if (!callerFrame) return {};

	// Parse stack frame for function name and location
	const match = callerFrame.match(/at (?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+))/);
	if (!match) return {};

	return {
		functionName: match[1] || 'anonymous',
		fileName: match[2],
		lineNumber: parseInt(match[3], 10),
		stackTrace: stack.slice(0, depth + 1).map(frame => frame.trim()),
	};
}

/**
 * A flexible and dynamic logger with emoji support
 */
export class Logger {
	private static defaultOptions: LogOptions = {
		emoji: true,
		timestamp: true,
		color: true,
		stackDepth: 1, // Default to showing immediate caller
	};

	private options: LogOptions;
	private context: string;
	private logBuffer: BufferedLog[] = [];
	private sequence: number = 0;

	/**
	 * Creates a new Logger instance
	 * @param context The context for this logger (e.g., component or service name)
	 * @param options Configuration options for the logger
	 */
	constructor(context: string, options: LogOptions = {}) {
		this.context = context;
		this.options = {...Logger.defaultOptions, ...options};
		this.clearBuffer();
	}

	/**
	 * Clears the log buffer and resets sequence
	 */
	private clearBuffer(): void {
		this.logBuffer = [];
		this.sequence = 0;
	}

	/**
	 * Saves all buffered logs to the database at once
	 */
	public async saveBufferedLogs(): Promise<void> {
		if (this.logBuffer.length === 0) return;

		try {
			await LogService.createLogs(this.logBuffer);
			this.clearBuffer();
		} catch (error) {
			console.error('[Logger DB] Failed to save buffered logs:', error);
		}
	}

	/**
	 * Log a debug message
	 * @param message The message to log
	 * @param data Optional data to include
	 */
	public async debug(message: string, data?: any): Promise<void> {
		await this.log('debug', message, data);
	}

	/**
	 * Log an info message
	 * @param message The message to log
	 * @param data Optional data to include
	 */
	public async info(message: string, data?: any): Promise<void> {
		await this.log('info', message, data);
	}

	/**
	 * Log a warning message
	 * @param message The message to log
	 * @param data Optional data to include
	 */
	public async warn(message: string, data?: any): Promise<void> {
		await this.log('warn', message, data);
	}

	/**
	 * Log an error message
	 * @param message The message to log
	 * @param error Optional error to include
	 */
	public async error(message: string, error?: any): Promise<void> {
		await this.log('error', message, error);
	}

	/**
	 * Log a success message
	 * @param message The message to log
	 * @param data Optional data to include
	 */
	public async success(message: string, data?: any): Promise<void> {
		await this.log('success', message, data);
	}

	/**
	 * Internal log method
	 */
	private async log(
		level: LogLevel,
		message: string,
		data?: any,
	): Promise<void> {
		const timestamp = this.options.timestamp
			? `[${new Date().toISOString()}]`
			: '';
		const emoji = this.options.emoji ? this.getEmoji(level) : '';
		const prefix = this.options.prefix ? `${this.options.prefix} ` : '';
		const contextStr = this.context ? `[${this.context}]` : '';

		// Get caller information with configurable stack depth
		const depth = this.options.stackDepth ?? 1;
		const {functionName, fileName, lineNumber, stackTrace} =
			getCallerInfo(depth);

		// Add caller info to message
		const location = functionName ? ` @${functionName}` : '';
		const lineInfo = fileName ? ` (${fileName}:${lineNumber})` : '';

		const formattedMessage = `${timestamp} ${emoji} ${prefix}${contextStr}${location}${lineInfo} ${message}`;

		// Add stack trace for errors
		if (level === 'error' && stackTrace) {
			message += '\n' + stackTrace.join('\n');
		}

		switch (level) {
			case 'debug':
				console.debug(this.colorize(formattedMessage, '\x1b[36m', level));
				break;
			case 'info':
				console.info(this.colorize(formattedMessage, '\x1b[34m', level));
				break;
			case 'warn':
				console.warn(this.colorize(formattedMessage, '\x1b[33m', level));
				break;
			case 'error':
				console.error(this.colorize(formattedMessage, '\x1b[31m', level));
				break;
			case 'success':
				console.log(this.colorize(formattedMessage, '\x1b[32m', level));
				break;
		}

		if (data) {
			if (level === 'error' && data instanceof Error) {
				console.error(data);
			} else {
				console.log(data);
			}
		}

		// Buffer the log for later database storage
		this.logBuffer.push({
			timestamp: new Date(),
			level,
			message,
			context: this.context,
			data: data || undefined,
			sequence: this.sequence++,
		});
	}

	/**
	 * Get emoji for log level
	 */
	private getEmoji(level: LogLevel): string {
		switch (level) {
			case 'debug':
				return '🔍';
			case 'info':
				return 'ℹ️';
			case 'warn':
				return '⚠️';
			case 'error':
				return '❌';
			case 'success':
				return '✅';
			default:
				return '';
		}
	}

	/**
	 * Apply color to message if enabled
	 */
	private colorize(
		message: string,
		colorCode: string,
		level: LogLevel,
	): string {
		if (!this.options.color) return message;
		return `${colorCode}${message}\x1b[0m`;
	}
}

// Create a default logger
export const logger = new Logger('App');
