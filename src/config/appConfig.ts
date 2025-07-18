// Configuration for development environment settings

/**
 * Environment configuration for the application
 * These values can be overridden by setting environment variables in .env files
 */
const config = {
	// Application settings
	app: {
		// Days until a company can be scraped again
		companyScrapeIntervalDays: parseInt(
			process.env.NEXT_PUBLIC_COMPANY_SCRAPE_INTERVAL_DAYS || '7',
			10,
		),

		// Days until a job application is considered stale
		jobStaleAfterDays: parseInt(
			process.env.NEXT_PUBLIC_JOB_STALE_AFTER_DAYS || '14',
			10,
		),
	},

	// Feature flags
	features: {
		enableKanbanView: process.env.NEXT_PUBLIC_ENABLE_KANBAN_VIEW !== 'false',
		enableDataVisualization:
			process.env.NEXT_PUBLIC_ENABLE_DATA_VISUALIZATION === 'true',
	},
};

export default config;
