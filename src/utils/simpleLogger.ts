/**
 * Simple console logger for scripts to avoid dependency issues
 */
export class SimpleLogger {
	private context: string;

	constructor(context: string) {
		this.context = context;
	}

	private formatMessage(
		level: string,
		message: string,
		...args: any[]
	): string {
		const timestamp = new Date().toISOString();
		const formattedArgs = args
			.map(arg =>
				typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg),
			)
			.join(' ');
		return `${timestamp} [${level}] ${this.context}: ${message} ${formattedArgs}`.trim();
	}

	info(message: string, ...args: any[]): void {
		console.log(this.formatMessage('INFO', message, ...args));
	}

	error(message: string, ...args: any[]): void {
		console.error(this.formatMessage('ERROR', message, ...args));
	}

	warn(message: string, ...args: any[]): void {
		console.warn(this.formatMessage('WARN', message, ...args));
	}

	debug(message: string, ...args: any[]): void {
		console.log(this.formatMessage('DEBUG', message, ...args));
	}

	success(message: string, ...args: any[]): void {
		console.log(this.formatMessage('SUCCESS', message, ...args));
	}
}
