import {SavedJob} from '@/models/SavedJob';
import {EnhancedLogger} from '@/utils/enhancedLogger';

const logger = EnhancedLogger.getLogger('SavedJobService', {
	logToFile: true,
	logToConsole: true,
	logDir: '/tmp/scoutly-logs',
	logFileName: 'saved-job-service.log',
});

export class SavedJobService {
	/**
	 * Get all saved jobs for a user
	 */
	static async getSavedJobsByUserId(userId: string) {
		try {
			const savedJobs = await SavedJob.find({userId})
				.populate('companyId')
				.sort({createdAt: -1});

			logger.debug(
				`Retrieved ${savedJobs.length} saved jobs for user ${userId}`,
			);
			return savedJobs;
		} catch (error: any) {
			logger.error(`Error getting saved jobs for user ${userId}:`, error);
			// Return empty array instead of throwing error to handle new users gracefully
			return [];
		}
	}

	/**
	 * Save a job for a user
	 */
	static async saveJob(userId: string, jobId: string, companyId: string) {
		try {
			// Check if already saved
			const existingSavedJob = await SavedJob.findOne({userId, jobId});

			if (existingSavedJob) {
				return existingSavedJob;
			}

			// Save the job
			const savedJob = await SavedJob.create({
				userId,
				jobId,
				companyId,
				status: 'saved', // Initial status
			});

			logger.info(
				`User ${userId} saved job ${jobId} from company ${companyId}`,
			);
			return savedJob;
		} catch (error: any) {
			logger.error(`Error saving job for user ${userId}:`, error);
			throw new Error(`Failed to save job: ${error.message}`);
		}
	}

	/**
	 * Unsave a job for a user
	 */
	static async unsaveJob(userId: string, jobId: string) {
		try {
			const result = await SavedJob.findOneAndDelete({userId, jobId});

			if (!result) {
				throw new Error('Saved job not found');
			}

			logger.info(`User ${userId} removed saved job ${jobId}`);
			return {success: true};
		} catch (error: any) {
			logger.error(`Error unsaving job for user ${userId}:`, error);
			throw new Error(`Failed to unsave job: ${error.message}`);
		}
	}

	/**
	 * Update saved job status
	 */
	static async updateJobStatus(userId: string, jobId: string, status: string) {
		try {
			const savedJob = await SavedJob.findOneAndUpdate(
				{userId, jobId},
				{status},
				{new: true},
			);

			if (!savedJob) {
				throw new Error('Saved job not found');
			}

			logger.info(`User ${userId} updated job ${jobId} status to ${status}`);
			return savedJob;
		} catch (error: any) {
			logger.error(`Error updating job status for user ${userId}:`, error);
			throw new Error(`Failed to update job status: ${error.message}`);
		}
	}
}
