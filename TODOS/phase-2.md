Phase 2: Building the Automation Engine (TDD)
Goal: Implement the "Scheduler" and "Worker" scripts that will form the core of the automated scraping system. We will follow a test-driven apprexport async function processJob(job: any, logger: Logger) {
const company = await Company.findById(job.companyId);
// For now, we'll use your hardcoded user for the orchestrator
const user = await User.findOne({ email: 'judithv.sanchezc@gmail.com' });

    if (!company || !user) {
    	throw new Error('Company or User not found for job');
    }

    await logger.info(`Processing job for company: ${company.company}`, { companyId: company.companyID, jobId: job._id });

    // Use the pipeline instead of the legacy orchestrator
    await executeJobMatchingPipeline([company], user.cvUrl!, user.candidateInfo!, user.email);
    await Company.updateOne({ _id: company._id }, { $set: { lastSuccessfulScrape: new Date() } });

}component.

**Architecture Note**: This phase will use the pipeline-based job matching architecture exclusively. The legacy JobMatchingOrchestrator will be removed in favor of the more robust pipeline system.

**Prerequisites**:

- UserCompanyPreference model is the source of truth for user-company relationships (Phase 1.1)
- Rate limiting is implemented for pipeline architecture (Phase 1.2)
- JobQueue model has been created

Step 2.1: The Scheduler Script (scheduler.ts)
Purpose: This script's sole responsibility is to run periodically, check which scrapes are due based on user preferences, and add corresponding jobs to the JobQueue. It does not perform any scraping itself.

A. Write the Scheduler Tests (Test First)
Action: Create a new test file: src/scripts/**tests**/scheduler.test.ts

Goal: Define and verify the decision-making logic of the scheduler. We will use vi.useFakeTimers() to control the "current" time for testing cooldown logic.

// src/scripts/**tests**/scheduler.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
// ... imports for models and the function to be tested

vi.mock('@/models/User');
vi.mock('@/models/Company');
vi.mock('@/models/UserCompanyPreference');
vi.mock('@/models/JobQueue');

describe('Scoutly Scheduler Logic', () => {

beforeEach(() => {
vi.clearAllMocks();
vi.useFakeTimers();
});

it('should queue a job for a high-rank company if its cooldown has passed', () => {
// 1. Setup: Mock a User, a Company with a `lastSuccessfulScrape` date from 13 hours ago,
// and a UserCompanyPreference linking them with a rank of 95.
// 2. Execute: Run the scheduler's main function.
// 3. Assert: Verify that `JobQueue.create` was called with the correct companyId and a 'pending' status.
});

it('should NOT queue a job for a high-rank company if it was scraped recently', () => {
// 1. Setup: Mock a Company with `lastSuccessfulScrape` from 2 hours ago and a rank of 95.
// 2. Execute: Run the scheduler's main function.
// 3. Assert: Verify that `JobQueue.create` was NOT called.
});

it('should queue a job for a low-rank company only after its long cooldown has passed', () => {
// 1. Setup: Mock a Company with `lastSuccessfulScrape` from 8 days ago and a rank of 55.
// 2. Execute: Run the scheduler's main function.
// 3. Assert: Verify that `JobQueue.create` was called.
});

it('should NOT queue a job if one is already pending for that company', () => {
// 1. Setup: Mock a company that is due for a scrape.
// 2. Mock `JobQueue.findOne` to return an existing pending job for that company.
// 3. Execute: Run the scheduler's main function.
// 4. Assert: Verify that `JobQueue.create` was NOT called.
});

});

B. Implement the Scheduler Script
Action: Create the file src/scripts/scheduler.ts.

Goal: Write the implementation that makes the tests pass.

// src/scripts/scheduler.ts
import dbConnect from '@/middleware/database';
import { User } from '@/models/User';
import { Company } from '@/models/Company';
import { UserCompanyPreference } from '@/models/UserCompanyPreference';
import { JobQueue, JobStatus } from '@/models/JobQueue';
import { Logger } from '@/utils/logger'; // Use the database-backed logger

const getCooldownInHours = (rank: number): number => {
if (rank >= 95) return 12; // Twice a day
if (rank >= 85) return 24; // Once a day
if (rank >= 70) return 48; // Every 2 days
if (rank >= 50) return 7 _ 24; // Weekly
return 14 _ 24; // Every two weeks
};

export async function queueDueJobs() {
const logger = new Logger('Scheduler');
await dbConnect();

const allUsers = await User.find({});
await logger.info(`Checking preferences for ${allUsers.length} users.`);

for (const user of allUsers) {
const preferences = await UserCompanyPreference.find({ userId: user.\_id, isTracking: true }).populate('companyId');

    for (const pref of preferences) {
      const company = pref.companyId as any; // Cast because it's populated
      if (!company) continue;

      const cooldownHours = getCooldownInHours(pref.rank);
      const now = new Date();
      const lastScrape = company.lastSuccessfulScrape || new Date(0);
      const hoursSinceLastScrape = (now.getTime() - lastScrape.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastScrape > cooldownHours) {
        const existingJob = await JobQueue.findOne({
          companyId: company._id,
          status: { $in: [JobStatus.PENDING, JobStatus.PROCESSING] }
        });

        if (!existingJob) {
          await JobQueue.create({ companyId: company._id, status: JobStatus.PENDING });
          await logger.info(`Queued job for company: ${company.company}`, { companyId: company.companyID, userId: user._id });
        }
      }
    }

}
await logger.saveBufferedLogs(); // Save all logs from this run
}

// Allow running the script directly
if (require.main === module) {
queueDueJobs().then(() => process.exit(0));
}

Step 2.2: The Queue Worker Script (worker.ts)
Purpose: This script runs as a long-lived background process. It continuously polls the JobQueue, picks up PENDING jobs, and passes them to the existing JobMatchingOrchestrator to be executed.

A. Write the Worker Tests (Test First)
Action: Create a new test file: src/scripts/**tests**/worker.test.ts

Goal: Ensure the worker correctly processes and updates jobs from the queue.

// src/scripts/**tests**/worker.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
// ... imports

vi.mock('@/models/JobQueue');
vi.mock('@/services/jobMatchingOrchestrator');
vi.mock('@/models/Company');

describe('Scoutly Queue Worker Logic', () => {

it('should find a pending job and change its status to processing', async () => {
// 1. Setup: Mock `JobQueue.findOneAndUpdate` to find a pending job and return it.
// 2. Execute: Run the worker's main processing function once.
// 3. Assert: Verify the status update call was made correctly.
});

it('should call the JobMatchingOrchestrator with the correct data', async () => {
// 1. Setup: Mock a pending job being found.
// 2. Execute: Run the worker's main processing function.
// 3. Assert: Verify that `orchestrator.orchestrateJobMatching` was called with the company
// and user data associated with the job.
});

it('should update the job to "completed" on successful orchestration', async () => {
// 1. Setup: Mock a successful run of the orchestrator.
// 2. Execute: Run the worker's main processing function.
// 3. Assert: Verify that the job's status was updated to `JobStatus.COMPLETED`.
});

it('should update the Company `lastSuccessfulScrape` date on success', async () => {
// 1. Setup: Mock a successful run.
// 2. Execute: Run the worker.
// 3. Assert: Verify that `Company.updateOne` was called with a new `$set: { lastSuccessfulScrape: ... }`.
});

it('should update the job to "failed" on orchestration error', async () => {
// 1. Setup: Mock the orchestrator to throw an error.
// 2. Execute: Run the worker's main processing function.
// 3. Assert: Verify that the job's status was updated to `JobStatus.FAILED`.
});

});

B. Implement the Worker Script
Action: Create the file src/scripts/worker.ts.

Goal: Write the implementation that makes the worker tests pass.

// // src/scripts/worker.ts
import dbConnect from '@/middleware/database';
import { JobQueue, JobStatus } from '@/models/JobQueue';
import { Company } from '@/models/Company';
import { User } from '@/models/User';
import { executeJobMatchingPipeline } from '@/services/pipeline/JobMatchingPipelineConfig';
import { Logger } from '@/utils/logger'; // Use the database-backed logger

export async function processJob(job: any, logger: Logger) {
const company = await Company.findById(job.companyId);
// For now, we'll use your hardcoded user for the orchestrator
const user = await User.findOne({ email: 'judithv.sanchezc@gmail.com' });

if (!company || !user) {
throw new Error('Company or User not found for job');
}

await logger.info(`Processing job for company: ${company.company}`, { companyId: company.companyID, jobId: job.\_id });

await orchestrator.orchestrateJobMatching(company, user.cvUrl!, user.candidateInfo!, user.email);
await Company.updateOne({ \_id: company.\_id }, { $set: { lastSuccessfulScrape: new Date() } });
}

async function startWorker() {
await dbConnect();
const workerLogger = new Logger('Worker');
await workerLogger.info('Worker started. Polling for jobs...');
await workerLogger.saveBufferedLogs();

while (true) {
const job = await JobQueue.findOneAndUpdate(
{ status: JobStatus.PENDING },
{ $set: { status: JobStatus.PROCESSING, lastAttemptAt: new Date() } },
{ sort: { createdAt: 1 }, new: true }
);

    if (job) {
      const jobLogger = new Logger(`Worker-Job-${job._id}`);
      try {
        await processJob(job, jobLogger);
        job.status = JobStatus.COMPLETED;
        await jobLogger.success(`Job completed successfully.`);
      } catch (error: any) {
        job.status = JobStatus.FAILED;
        await jobLogger.error(`Job failed: ${error.message}`, { error });
      }
      await job.save();
      await jobLogger.saveBufferedLogs();
    } else {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

}
}

if (require.main === module) {
startWorker();
}

Step 2.3: Implementing Visibility & Monitoring
Purpose: To ensure you can easily monitor the activity and health of the background scheduler and worker processes without needing a dedicated UI.

A. Implement Persistent Database Logging
Action: Use the existing database-backed Logger (from src/utils/logger.ts) within the scheduler.ts and worker.ts scripts.

Implementation:

At the start of each script run (or job process), instantiate a new Logger with a specific context (e.g., 'Scheduler', 'Worker-Job-<ID>').

Use logger.info(), logger.error(), etc., throughout the scripts to record key events.

At the end of each logical operation (e.g., after the scheduler finishes its cycle, or after a worker processes a job), call await logger.saveBufferedLogs();.

Benefit: This unifies all system logs—from manual runs, scheduled tasks, and worker processes—into a single logs collection in your MongoDB. This provides a permanent, queryable record of all background activity.

B. Real-time Log Monitoring
How: Once the system is running in Docker (in Phase 3), you will monitor the live output of all processes.

Command:

docker-compose logs -f app

What you'll see: A continuous stream of logs from the Next.js application, the scheduler, and the worker. This is your primary tool for seeing what the system is doing at any given moment.

C. On-Demand Queue Status Check
How: Leverage the existing src/scripts/fileQueueStatus.ts script you created. This script will act as a health check you can run anytime.

Command:

docker-compose exec app npx tsx src/scripts/fileQueueStatus.ts

What you'll see: A snapshot of the jobqueues collection, showing the count of PENDING, PROCESSING, COMPLETED, and FAILED jobs. This is invaluable for quickly diagnosing if the queue is backed up or if jobs are failing.
