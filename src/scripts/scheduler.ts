import dbConnect from '@/middleware/database';
import {User} from '@/models/User';
import {Company} from '@/models/Company';
import {UserCompanyPreference} from '@/models/UserCompanyPreference';
import {JobQueue, JobStatus} from '@/models/JobQueue';
import {Logger} from '@/utils/logger'; // Use the database-backed logger

/**
 * Calculate cooldown in hours based on company rank
 * Higher rank = more frequent scraping
 */
const getCooldownInHours = (rank: number): number => {
	if (rank >= 95) return 12; // Twice a day
	if (rank >= 85) return 24; // Once a day
	if (rank >= 70) return 48; // Every 2 days
	if (rank >= 50) return 7 * 24; // Weekly
	return 14 * 24; // Every two weeks
};

/**
 * Main scheduler function - checks all user preferences and queues jobs for companies
 * that are due for scraping based on their rank and last scrape time
 */
export async function queueDueJobs(): Promise<void> {
	const logger = new Logger('Scheduler');
	await dbConnect();

	try {
		const allUsers = await User.find({});
		await logger.info(`Checking preferences for ${allUsers.length} users.`);

		for (const user of allUsers) {
			const preferences = await UserCompanyPreference.find({
				userId: user._id,
				isTracking: true,
			}).populate('companyId');

			for (const pref of preferences) {
				const company = pref.companyId as any; // Cast because it's populated
				if (!company) continue;

				const cooldownHours = getCooldownInHours(pref.rank);
				const now = new Date();
				const lastScrape = company.lastSuccessfulScrape || new Date(0);
				const hoursSinceLastScrape =
					(now.getTime() - lastScrape.getTime()) / (1000 * 60 * 60);

				if (hoursSinceLastScrape > cooldownHours) {
					// Check if there's already a pending or processing job for this company
					const existingJob = await JobQueue.findOne({
						companyId: company._id,
						status: {$in: [JobStatus.PENDING, JobStatus.PROCESSING]},
					});

					if (!existingJob) {
						await JobQueue.create({
							companyId: company._id,
							status: JobStatus.PENDING,
						});
						await logger.info(`Queued job for company: ${company.company}`, {
							companyId: company.companyID,
							userId: user._id,
							rank: pref.rank,
							hoursSinceLastScrape: Math.round(hoursSinceLastScrape),
						});
					} else {
						await logger.debug(
							`Skipping ${company.company} - job already exists`,
							{
								companyId: company.companyID,
								existingJobStatus: existingJob.status,
							},
						);
					}
				} else {
					await logger.debug(
						`Skipping ${company.company} - cooldown not reached`,
						{
							companyId: company.companyID,
							hoursSinceLastScrape: Math.round(hoursSinceLastScrape),
							cooldownHours,
							rank: pref.rank,
						},
					);
				}
			}
		}

		await logger.saveBufferedLogs(); // Save all logs from this run
		await logger.info('Scheduler run completed successfully');
	} catch (error) {
		await logger.error('Scheduler run failed', error);
		await logger.saveBufferedLogs();
		throw error;
	}
}

// Allow running the script directly
if (require.main === module) {
	queueDueJobs()
		.then(() => {
			console.log('✅ Scheduler completed successfully');
			process.exit(0);
		})
		.catch(error => {
			console.error('❌ Scheduler failed:', error);
			process.exit(1);
		});
}
