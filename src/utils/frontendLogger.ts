/**
 * Frontend Logger Utility
 * Provides structured logging for the frontend with better debugging capabilities
 */

export interface LogEntry {
	timestamp: string;
	level: 'debug' | 'info' | 'warn' | 'error' | 'trace';
	context: string;
	message: string;
	data?: any;
	userAgent?: string;
	url?: string;
	userId?: string;
	sessionId?: string;
}

export class FrontendLogger {
	private context: string;
	private userId?: string;
	private sessionId: string;
	private isDevelopment: boolean;

	constructor(context: string, userId?: string) {
		this.context = context;
		this.userId = userId;
		this.sessionId = this.generateSessionId();
		this.isDevelopment = process.env.NODE_ENV === 'development';
	}

	private generateSessionId(): string {
		return Math.random().toString(36).substring(2) + Date.now().toString(36);
	}

	private createLogEntry(
		level: LogEntry['level'],
		message: string,
		data?: any,
	): LogEntry {
		return {
			timestamp: new Date().toISOString(),
			level,
			context: this.context,
			message,
			data,
			userAgent: navigator.userAgent,
			url: window.location.href,
			userId: this.userId,
			sessionId: this.sessionId,
		};
	}

	private formatConsoleOutput(entry: LogEntry): void {
		const emoji = {
			debug: '🔍',
			info: 'ℹ️',
			warn: '⚠️',
			error: '❌',
			trace: '📍',
		};

		const styles = {
			debug: 'color: #6B7280',
			info: 'color: #3B82F6',
			warn: 'color: #F59E0B',
			error: 'color: #EF4444',
			trace: 'color: #8B5CF6',
		};

		const prefix = `${emoji[entry.level]} [${entry.context}] ${entry.message}`;

		if (entry.data) {
			console.groupCollapsed(`%c${prefix}`, styles[entry.level]);
			console.log('Timestamp:', entry.timestamp);
			console.log('Data:', entry.data);
			if (entry.userId) console.log('User ID:', entry.userId);
			console.log('Session ID:', entry.sessionId);
			console.log('URL:', entry.url);
			console.groupEnd();
		} else {
			console.log(`%c${prefix}`, styles[entry.level]);
		}
	}

	private async sendToBackend(entry: LogEntry): Promise<void> {
		try {
			// Only send important logs to backend in production
			if (!this.isDevelopment && ['debug', 'trace'].includes(entry.level)) {
				return;
			}

			await fetch('/api/logs', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(entry),
			});
		} catch (error) {
			// Silently fail to avoid logging loops
			console.warn('Failed to send log to backend:', error);
		}
	}

	public debug(message: string, data?: any): void {
		const entry = this.createLogEntry('debug', message, data);
		this.formatConsoleOutput(entry);
		if (this.isDevelopment) {
			this.sendToBackend(entry);
		}
	}

	public info(message: string, data?: any): void {
		const entry = this.createLogEntry('info', message, data);
		this.formatConsoleOutput(entry);
		this.sendToBackend(entry);
	}

	public warn(message: string, data?: any): void {
		const entry = this.createLogEntry('warn', message, data);
		this.formatConsoleOutput(entry);
		this.sendToBackend(entry);
	}

	public error(message: string, data?: any): void {
		const entry = this.createLogEntry('error', message, data);
		this.formatConsoleOutput(entry);
		this.sendToBackend(entry);
	}

	public trace(message: string, data?: any): void {
		const entry = this.createLogEntry('trace', message, data);
		this.formatConsoleOutput(entry);
		if (this.isDevelopment) {
			this.sendToBackend(entry);
		}
	}

	// API call logging helpers
	public logApiRequest(url: string, method: string, body?: any): void {
		this.debug(`API Request: ${method} ${url}`, {
			url,
			method,
			body: body ? JSON.stringify(body) : undefined,
		});
	}

	public logApiResponse(url: string, status: number, response?: any): void {
		const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
		this[level](`API Response: ${status} ${url}`, {
			url,
			status,
			response: response ? JSON.stringify(response) : undefined,
		});
	}

	public logApiError(url: string, error: any): void {
		this.error(`API Error: ${url}`, {
			url,
			error: error.message || error.toString(),
			stack: error.stack,
		});
	}

	// User action logging
	public logUserAction(action: string, details?: any): void {
		this.info(`User Action: ${action}`, details);
	}

	// Component lifecycle logging
	public logComponentMount(componentName: string, props?: any): void {
		this.debug(`Component Mounted: ${componentName}`, props);
	}

	public logComponentUnmount(componentName: string): void {
		this.debug(`Component Unmounted: ${componentName}`);
	}

	// Form validation logging
	public logValidationError(field: string, error: string, value?: any): void {
		this.warn(`Validation Error: ${field}`, {
			field,
			error,
			value,
		});
	}

	// Authentication logging
	public logAuthEvent(event: string, details?: any): void {
		this.info(`Auth Event: ${event}`, details);
	}
}

// Create a default logger instance
export const frontendLogger = new FrontendLogger('Frontend');

// Helper function to create context-specific loggers
export function createLogger(context: string, userId?: string): FrontendLogger {
	return new FrontendLogger(context, userId);
}
