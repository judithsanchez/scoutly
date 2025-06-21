import dbConnect from '@/middleware/database';
import {JobQueue, JobStatus} from '@/models/JobQueue';
import {Company} from '@/models/Company';
import {User} from '@/models/User';
import {executeJobMatchingPipeline} from '@/services/pipeline/JobMatchingPipelineConfig';
import {Logger} from '@/utils/logger';

/**
 * Process a single job from the queue
 */
export async function processJob(job: any, logger: Logger) {
	const company = await Company.findById(job.companyId);
	// For now, we'll use the hardcoded user for the orchestrator
	const user = await User.findOne({email: 'judithv.sanchezc@gmail.com'});

	if (!company || !user) {
		throw new Error('Company or User not found for job');
	}

	await logger.info(`Processing job for company: ${company.company}`, {
		companyId: company.companyID,
		jobId: job._id,
	});

	// Use the pipeline directly instead of the legacy orchestrator
	await executeJobMatchingPipeline(
		[company],
		user.cvUrl!,
		user.candidateInfo!,
		user.email,
	);

	// Update the company's last successful scrape date
	await Company.updateOne(
		{_id: company._id},
		{$set: {lastSuccessfulScrape: new Date()}},
	);
}

/**
 * Start the worker process - continuously polls for pending jobs
 */
async function startWorker() {
	await dbConnect();
	const workerLogger = new Logger('Worker');
	await workerLogger.info('Worker started. Polling for jobs...');
	await workerLogger.saveBufferedLogs();

	while (true) {
		try {
			// Find and claim the next pending job atomically
			const job = await JobQueue.findOneAndUpdate(
				{status: JobStatus.PENDING},
				{$set: {status: JobStatus.PROCESSING, lastAttemptAt: new Date()}},
				{sort: {createdAt: 1}, new: true},
			);

			if (job) {
				const jobLogger = new Logger(`Worker-Job-${job._id}`);
				try {
					await processJob(job, jobLogger);
					job.status = JobStatus.COMPLETED;
					await jobLogger.success(`Job completed successfully.`);
				} catch (error: any) {
					job.status = JobStatus.FAILED;
					await jobLogger.error(`Job failed: ${error.message}`, {error});
				}
				await job.save();
				await jobLogger.saveBufferedLogs();
			} else {
				// No pending jobs, wait before checking again
				await new Promise(resolve => setTimeout(resolve, 5000));
			}
		} catch (error: any) {
			await workerLogger.error(`Worker error: ${error.message}`, {error});
			await workerLogger.saveBufferedLogs();
			// Wait a bit before retrying to avoid tight error loops
			await new Promise(resolve => setTimeout(resolve, 10000));
		}
	}
}

// Allow running the script directly
if (require.main === module) {
	startWorker().catch(console.error);
}
