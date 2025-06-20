/**
 * Enhanced Logger for Background Jobs
 *
 * Provides both console and file logging capabilities for better debugging
 * without the database dependencies of the main Logger.
 */

import fs from 'fs';
import path from 'path';
import util from 'util';

// Log levels with color codes for console output
enum LogLevel {
	DEBUG = 'DEBUG',
	INFO = 'INFO',
	SUCCESS = 'SUCCESS',
	WARN = 'WARN',
	ERROR = 'ERROR',
}

// Color codes for console output
const Colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	dim: '\x1b[2m',
	underscore: '\x1b[4m',
	blink: '\x1b[5m',
	reverse: '\x1b[7m',
	hidden: '\x1b[8m',

	black: '\x1b[30m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	white: '\x1b[37m',

	bgBlack: '\x1b[40m',
	bgRed: '\x1b[41m',
	bgGreen: '\x1b[42m',
	bgYellow: '\x1b[43m',
	bgBlue: '\x1b[44m',
	bgMagenta: '\x1b[45m',
	bgCyan: '\x1b[46m',
	bgWhite: '\x1b[47m',
};

// Configuration interface
interface EnhancedLoggerConfig {
	logToFile?: boolean;
	logToConsole?: boolean;
	logDir?: string;
	logFileName?: string;
	maxFileSize?: number; // Maximum file size in bytes before rotation (default 10MB)
	maxFiles?: number; // Maximum number of log files to keep (default 5)
	minLevel?: LogLevel; // Minimum log level to record
}

/**
 * Enhanced logger with file output and better debugging capabilities
 */
export class EnhancedLogger {
	private context: string;
	private config: EnhancedLoggerConfig;
	private logFilePath: string;
	private static instances: Map<string, EnhancedLogger> = new Map();

	/**
	 * Get a singleton logger instance for a context
	 */
	public static getLogger(
		context: string,
		config?: EnhancedLoggerConfig,
	): EnhancedLogger {
		const key = `${context}-${JSON.stringify(config || {})}`;

		if (!this.instances.has(key)) {
			this.instances.set(key, new EnhancedLogger(context, config));
		}

		return this.instances.get(key)!;
	}

	constructor(context: string, config?: EnhancedLoggerConfig) {
		this.context = context;

		// Default configuration
		this.config = {
			logToFile: true,
			logToConsole: true,
			logDir: path.join(process.cwd(), 'logs'),
			logFileName: `${context.toLowerCase()}.log`,
			maxFileSize: 10 * 1024 * 1024, // 10MB
			maxFiles: 5,
			minLevel: LogLevel.DEBUG,
			...config,
		};

		// Create log directory if it doesn't exist
		if (this.config.logToFile && this.config.logDir) {
			try {
				if (!fs.existsSync(this.config.logDir)) {
					fs.mkdirSync(this.config.logDir, {recursive: true});
				}
			} catch (error) {
				console.error(`Failed to create log directory: ${error}`);
				// Fallback to tmp directory
				this.config.logDir = '/tmp';
			}
		}

		this.logFilePath = path.join(this.config.logDir!, this.config.logFileName!);
	}

	/**
	 * Format a message with timestamp, level, and context
	 */
	private formatMessage(
		level: LogLevel,
		message: string,
		...args: any[]
	): string {
		const timestamp = new Date().toISOString();
		const formattedArgs = args
			.map(arg => {
				if (arg instanceof Error) {
					return `${arg.message}\n${arg.stack}`;
				} else if (typeof arg === 'object') {
					return util.inspect(arg, {depth: null, colors: false});
				} else {
					return String(arg);
				}
			})
			.join(' ');

		return `${timestamp} [${level}] ${this.context}: ${message} ${formattedArgs}`.trim();
	}

	/**
	 * Add color to console output based on level
	 */
	private colorize(level: LogLevel, message: string): string {
		switch (level) {
			case LogLevel.DEBUG:
				return `${Colors.cyan}${message}${Colors.reset}`;
			case LogLevel.INFO:
				return `${Colors.blue}${message}${Colors.reset}`;
			case LogLevel.SUCCESS:
				return `${Colors.green}${message}${Colors.reset}`;
			case LogLevel.WARN:
				return `${Colors.yellow}${message}${Colors.reset}`;
			case LogLevel.ERROR:
				return `${Colors.red}${message}${Colors.reset}`;
			default:
				return message;
		}
	}

	/**
	 * Write to log file with rotation if needed
	 */
	private writeToFile(message: string): void {
		if (!this.config.logToFile) return;

		try {
			// Check if file needs rotation
			if (fs.existsSync(this.logFilePath)) {
				const stats = fs.statSync(this.logFilePath);
				if (stats.size > (this.config.maxFileSize || 0)) {
					this.rotateLogFiles();
				}
			}

			// Append to log file
			fs.appendFileSync(this.logFilePath, message + '\n');
		} catch (error) {
			// Don't throw - just output to console that file logging failed
			console.error(`Failed to write to log file: ${error}`);
		}
	}

	/**
	 * Rotate log files
	 */
	private rotateLogFiles(): void {
		try {
			const maxFiles = this.config.maxFiles || 5;

			// Remove oldest log file if we've reached max
			const oldestLog = `${this.logFilePath}.${maxFiles}`;
			if (fs.existsSync(oldestLog)) {
				fs.unlinkSync(oldestLog);
			}

			// Shift existing log files
			for (let i = maxFiles - 1; i > 0; i--) {
				const oldPath = `${this.logFilePath}.${i}`;
				const newPath = `${this.logFilePath}.${i + 1}`;
				if (fs.existsSync(oldPath)) {
					fs.renameSync(oldPath, newPath);
				}
			}

			// Rename current log file
			if (fs.existsSync(this.logFilePath)) {
				fs.renameSync(this.logFilePath, `${this.logFilePath}.1`);
			}
		} catch (error) {
			console.error(`Failed to rotate log files: ${error}`);
		}
	}

	/**
	 * Log a message at the specified level
	 */
	private log(level: LogLevel, message: string, ...args: any[]): void {
		// Skip if below minimum level
		if (this.shouldSkip(level)) return;

		const formattedMessage = this.formatMessage(level, message, ...args);

		// Write to console if enabled
		if (this.config.logToConsole) {
			const colorizedMessage = this.colorize(level, formattedMessage);

			switch (level) {
				case LogLevel.ERROR:
					console.error(colorizedMessage);
					break;
				case LogLevel.WARN:
					console.warn(colorizedMessage);
					break;
				default:
					console.log(colorizedMessage);
					break;
			}
		}

		// Write to file if enabled
		this.writeToFile(formattedMessage);
	}

	/**
	 * Check if a log message should be skipped based on level
	 */
	private shouldSkip(level: LogLevel): boolean {
		const levels = [
			LogLevel.DEBUG,
			LogLevel.INFO,
			LogLevel.SUCCESS,
			LogLevel.WARN,
			LogLevel.ERROR,
		];
		const minLevelIndex = levels.indexOf(this.config.minLevel!);
		const currentLevelIndex = levels.indexOf(level);

		return currentLevelIndex < minLevelIndex;
	}

	// Public logging methods

	debug(message: string, ...args: any[]): void {
		this.log(LogLevel.DEBUG, message, ...args);
	}

	info(message: string, ...args: any[]): void {
		this.log(LogLevel.INFO, message, ...args);
	}

	success(message: string, ...args: any[]): void {
		this.log(LogLevel.SUCCESS, message, ...args);
	}

	warn(message: string, ...args: any[]): void {
		this.log(LogLevel.WARN, message, ...args);
	}

	error(message: string, ...args: any[]): void {
		this.log(LogLevel.ERROR, message, ...args);
	}

	/**
	 * Get all logs as a string (useful for debugging)
	 */
	getAllLogs(): string {
		if (!this.config.logToFile || !fs.existsSync(this.logFilePath)) {
			return 'No logs available';
		}

		return fs.readFileSync(this.logFilePath, 'utf8');
	}

	/**
	 * Clear all logs
	 */
	clearLogs(): void {
		if (this.config.logToFile && fs.existsSync(this.logFilePath)) {
			fs.writeFileSync(this.logFilePath, '');
		}
	}
}
