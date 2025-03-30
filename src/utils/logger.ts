type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

interface LogOptions {
	emoji?: boolean;
	timestamp?: boolean;
	prefix?: string;
	color?: boolean;
}

/**
 * A flexible and dynamic logger with emoji support
 */
export class Logger {
	private static defaultOptions: LogOptions = {
		emoji: true,
		timestamp: true,
		color: true,
	};

	private options: LogOptions;
	private context: string;

	/**
	 * Creates a new Logger instance
	 * @param context The context for this logger (e.g., component or service name)
	 * @param options Configuration options for the logger
	 */
	constructor(context: string, options: LogOptions = {}) {
		this.context = context;
		this.options = {...Logger.defaultOptions, ...options};
	}

	/**
	 * Log a debug message
	 * @param message The message to log
	 * @param data Optional data to include
	 */
	debug(message: string, data?: any): void {
		this.log('debug', message, data);
	}

	/**
	 * Log an info message
	 * @param message The message to log
	 * @param data Optional data to include
	 */
	info(message: string, data?: any): void {
		this.log('info', message, data);
	}

	/**
	 * Log a warning message
	 * @param message The message to log
	 * @param data Optional data to include
	 */
	warn(message: string, data?: any): void {
		this.log('warn', message, data);
	}

	/**
	 * Log an error message
	 * @param message The message to log
	 * @param error Optional error to include
	 */
	error(message: string, error?: any): void {
		this.log('error', message, error);
	}

	/**
	 * Log a success message
	 * @param message The message to log
	 * @param data Optional data to include
	 */
	success(message: string, data?: any): void {
		this.log('success', message, data);
	}

	/**
	 * Internal log method
	 */
	private log(level: LogLevel, message: string, data?: any): void {
		const timestamp = this.options.timestamp
			? `[${new Date().toISOString()}]`
			: '';
		const emoji = this.options.emoji ? this.getEmoji(level) : '';
		const prefix = this.options.prefix ? `${this.options.prefix} ` : '';
		const contextStr = this.context ? `[${this.context}]` : '';

		const formattedMessage = `${timestamp} ${emoji} ${prefix}${contextStr} ${message}`;

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
