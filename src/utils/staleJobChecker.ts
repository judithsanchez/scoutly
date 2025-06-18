import {SavedJob} from '@/models/SavedJob';
import dbConnect from '@/middleware/database';
import {Logger} from '@/utils/logger';

const logger = new Logger('StaleJobChecker');

/**
 * Checks for job applications that have been in APPLIED status for too long
 * and automatically marks them as STALE.
 *
 * This function can be called from API routes, scheduled jobs, or other server code.
 */
export async function checkForStaleJobs() {
	try {
		// Ensure DB connection
		await dbConnect();
		logger.info('Running stale job check...');

		// Use the static method we defined on the SavedJob model
		// Need to explicitly cast to any here since TypeScript doesn't recognize our static method
		const staleCount = await (SavedJob as any).checkAndUpdateStaleJobs();

		logger.info(`Marked ${staleCount} job(s) as stale`);
		return {success: true, staleJobsUpdated: staleCount};
	} catch (error) {
		logger.error('Error checking for stale jobs:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}
