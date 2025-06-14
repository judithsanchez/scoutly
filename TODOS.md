# TODOs

## Scraping Enhancements

- [ ] Create a custom scraper for Netflix

## AI Enhancements

- [ ] Create rate limits strategy

## Features

- [ ] Add authentication system
- [ ] Implement user preferences storage
- [ ] Add job alert notifications
- [ ] Create dashboard for tracking applications

## Technical Debt

- [ ] Add comprehensive unit tests

## Documentation

- [ ] Add API documentation with OpenAPI/Swagger
- [ ] Create deployment guide

## Jobs

Project: Implement a Resilient, Priority-Based Background Job System

### Step 1: Update Database Models

We'll start by modifying the Company model and creating the new JobQueue model.

#### 1.a. Modify `src/models/Company.ts`

Add the `priority` and `lastScrapedAt` fields to track scheduling state.

```typescript
// src/models/Company.ts
import mongoose, {Schema, Document} from 'mongoose';

export enum WorkModel {
	FULLY_REMOTE = 'FULLY_REMOTE',
	HYBRID = 'HYBRID',
	IN_OFFICE = 'IN_OFFICE',
}

export enum CompanyPriority {
	HIGH = 'high',
	MEDIUM = 'medium',
	LOW = 'low',
}

export interface ICompany extends Document {
	companyID: string;
	company: string;
	careers_url: string;
	selector: string;
	work_model: WorkModel;
	headquarters: string;
	office_locations: string[];
	fields: string[];
	openToApplication: boolean;
	priority: CompanyPriority;
	lastScrapedAt: Date | null;
	isProblematic: boolean;
	scrapeErrors: mongoose.Schema.Types.ObjectId[];
}

const CompanySchema = new Schema<ICompany>(
	{
		companyID: {type: String, required: true, unique: true},
		company: {type: String, required: true},
		careers_url: {type: String, required: true},
		selector: {type: String, default: ''},
		work_model: {type: String, enum: Object.values(WorkModel), required: true},
		headquarters: {type: String, required: true},
		office_locations: [{type: String}],
		fields: [{type: String}],
		openToApplication: {type: Boolean, default: false, required: true},
		priority: {
			type: String,
			enum: Object.values(CompanyPriority),
			default: CompanyPriority.MEDIUM,
			required: true,
		},
		lastScrapedAt: {
			type: Date,
			default: null,
		},
		isProblematic: {type: Boolean, default: false},
		scrapeErrors: [{type: Schema.Types.ObjectId, ref: 'ScrapeError'}],
	},
	{timestamps: true},
);

CompanySchema.index({isProblematic: 1, lastScrapedAt: 1});

export const Company =
	mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);
```

#### 1.b. Create `src/models/JobQueue.ts`

This new model will manage the queue of companies to be processed.

```typescript
// src/models/JobQueue.ts
import mongoose, {Schema, Document} from 'mongoose';

export enum JobStatus {
	PENDING = 'pending',
	PROCESSING = 'processing',
	COMPLETED = 'completed',
	FAILED = 'failed',
}

export interface IJobQueue extends Document {
	companyId: mongoose.Schema.Types.ObjectId;
	status: JobStatus;
	lastAttemptAt: Date | null;
	retryCount: number;
}

const JobQueueSchema = new Schema<IJobQueue>(
	{
		companyId: {
			type: Schema.Types.ObjectId,
			ref: 'Company',
			required: true,
		},
		status: {
			type: String,
			enum: Object.values(JobStatus),
			default: JobStatus.PENDING,
			required: true,
		},
		lastAttemptAt: {
			type: Date,
			default: null,
		},
		retryCount: {
			type: Number,
			default: 0,
		},
	},
	{timestamps: true},
);

JobQueueSchema.index({status: 1, createdAt: 1});

export const JobQueue =
	mongoose.models.JobQueue ||
	mongoose.model<IJobQueue>('JobQueue', JobQueueSchema);
```

---

### Step 2: Create and Run Migration Script

This one-time script updates your existing companies to include the new fields.

#### 2.a. Create `src/scripts/migrateCompanies.ts`

```typescript
// src/scripts/migrateCompanies.ts
import {connectDB, disconnectDB} from '../config/database';
import {Company, CompanyPriority} from '../models/Company';
import {Logger} from '../utils/logger';

const logger = new Logger('CompanyMigration');

async function migrate() {
	try {
		await connectDB();
		logger.info('Connected to database for migration.');

		const result = await Company.updateMany(
			{priority: {$exists: false}},
			{
				$set: {
					priority: CompanyPriority.MEDIUM,
					lastScrapedAt: null,
				},
			},
		);

		logger.success(
			`Migration complete. Matched ${result.matchedCount} documents, modified ${result.modifiedCount} documents.`,
		);
	} catch (error) {
		logger.error('Error during company migration:', error);
		process.exit(1);
	} finally {
		await disconnectDB();
		logger.info('Database disconnected.');
	}
}

migrate();
```

#### 2.b. Run the migration script

Execute this command once from your host machine:

```bash
docker compose exec app npx tsx src/scripts/migrateCompanies.ts
```

---

### Step 3: Create the Producer and Consumer Scripts

These two scripts form the core of the background processing system.

#### 3.a. Create the Enqueuer (Producer): `src/scripts/enqueueJobs.ts`

This script is run by cron to add jobs to the queue.

```typescript
// src/scripts/enqueueJobs.ts
import {connectDB, disconnectDB} from '../config/database';
import {Company} from '../models/Company';
import {JobQueue, JobStatus} from '../models/JobQueue';
import {Logger} from '../utils/logger';

const logger = new Logger('Enqueuer');

const CHECK_INTERVALS = {
	high: 24 * 60 * 60 * 1000, // 1 day
	medium: 3 * 24 * 60 * 60 * 1000, // 3 days
	low: 7 * 24 * 60 * 60 * 1000, // 7 days
};

async function enqueueJobs() {
	logger.info('Starting enqueuer process...');
	await connectDB();

	try {
		const now = new Date();
		const companies = await Company.find({
			$or: [
				{
					priority: 'high',
					lastScrapedAt: {$lte: new Date(now.getTime() - CHECK_INTERVALS.high)},
				},
				{
					priority: 'medium',
					lastScrapedAt: {
						$lte: new Date(now.getTime() - CHECK_INTERVALS.medium),
					},
				},
				{
					priority: 'low',
					lastScrapedAt: {$lte: new Date(now.getTime() - CHECK_INTERVALS.low)},
				},
				{lastScrapedAt: null},
			],
		});

		if (companies.length === 0) {
			logger.info('No companies are due for scraping at this time.');
			return;
		}

		logger.info(`Found ${companies.length} companies due for scraping.`);

		for (const company of companies) {
			const existingJob = await JobQueue.findOne({
				companyId: company._id,
				status: {$in: [JobStatus.PENDING, JobStatus.PROCESSING]},
			});

			if (!existingJob) {
				await JobQueue.create({
					companyId: company._id,
					status: JobStatus.PENDING,
				});
				logger.debug(`Enqueued job for company: ${company.company}`);
			}
		}
		logger.success('Enqueuer process finished successfully.');
	} catch (error) {
		logger.error('An error occurred in the enqueuer process:', error);
	} finally {
		await disconnectDB();
	}
}

enqueueJobs();
```

#### 3.b. Create the Worker (Consumer): `src/scripts/processQueue.ts`

This script runs continuously to process jobs from the queue.

```typescript
// src/scripts/processQueue.ts
import {connectDB, disconnectDB} from '../config/database';
import {Company} from '../models/Company';
import {JobQueue, JobStatus, IJobQueue} from '../models/JobQueue';
import {JobMatchingOrchestrator} from '../services/jobMatchingOrchestrator';
import {UserService} from '../services/userService';
import {Logger} from '../utils/logger';

const logger = new Logger('QueueWorker');
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// In a real multi-user app, this would be dynamic. For this system, we'll use a default.
const DEFAULT_USER_EMAIL = 'judithv.sanchezc@gmail.com';
const DEFAULT_CV_URL =
	'https://drive.google.com/file/d/1-0NUsEx0HmnTmcpMOjGSKdOJJ1Vd_uWL/view?usp=drive_link';
const DEFAULT_CANDIDATE_INFO = {
	/* Your default candidateInfo object from initializeFormData.ts */
};

async function processQueue() {
	logger.info('Starting queue worker...');
	await connectDB();
	const orchestrator = new JobMatchingOrchestrator();

	while (true) {
		let job: IJobQueue | null = null;
		try {
			job = await JobQueue.findOneAndUpdate(
				{status: JobStatus.PENDING},
				{$set: {status: JobStatus.PROCESSING, lastAttemptAt: new Date()}},
				{sort: {createdAt: 1}, new: true},
			).populate('companyId');

			if (job && job.companyId) {
				const company = job.companyId as any;
				logger.info(`Processing job for company: ${company.company}`);

				const user = await UserService.getOrCreateUser(DEFAULT_USER_EMAIL);

				await orchestrator.orchestrateJobMatching(
					company,
					DEFAULT_CV_URL,
					DEFAULT_CANDIDATE_INFO,
					user.email,
				);

				await Company.updateOne(
					{_id: company._id},
					{$set: {lastScrapedAt: new Date()}},
				);

				job.status = JobStatus.COMPLETED;
				await job.save();
				logger.success(`Successfully processed job for: ${company.company}`);
			} else {
				logger.debug('No pending jobs found. Waiting...');
				await sleep(20000); // Wait 20 seconds
			}
		} catch (error: any) {
			logger.error('Worker error while processing a job:', error.message);
			if (job) {
				const company = job.companyId as any;
				job.status = JobStatus.FAILED;
				job.retryCount = (job.retryCount || 0) + 1;
				await job.save();
				logger.warn(
					`Job for ${company?.company || 'unknown'} marked as failed.`,
				);
			}
		}
	}
}

processQueue().catch(async err => {
	logger.error('Queue worker crashed:', err);
	await disconnectDB();
	process.exit(1);
});
```

---

### Step 4: Update Docker Configuration

Finally, update your Docker setup to run all these components correctly.

#### 4.a. Create `scoutly-cron` file in your project's root directory.

# scoutly-cron

0 _/6 _ \* \* root cd /app && npx tsx src/scripts/enqueueJobs.ts >> /var/log/cron.log 2>&1
4.b. Create start.sh file in your project's root directory.

Bash

#!/bin/sh

# start.sh

echo "Starting container services..."

# Start the cron daemon in the background

cron

# Start the queue worker in the background

echo "Starting queue worker..."
npx tsx src/scripts/processQueue.ts &

# Start the Next.js app in the foreground

echo "Starting Next.js application..."
npm run dev
4.c. Make start.sh executable
Run this on your computer:

Bash

chmod +x start.sh
4.d. Update your Dockerfile

Dockerfile

# Dockerfile

FROM node:20-slim

# Install system dependencies for Playwright and cron

RUN apt-get update && apt-get install -yq --no-install-recommends cron libgdk-pixbuf2.0-0 libgtk-3-0 libatk-bridge2.0-0 libdrm2 libgbm1 libasound2 && rm -rf /var/lib/apt/lists/\*

WORKDIR /app
COPY package\*.json ./
RUN npm install

# Copy new cron job file

COPY scoutly-cron /etc/cron.d/scoutly-cron

# Give execution rights and create log file

RUN chmod 0644 /etc/cron.d/scoutly-cron && touch /var/log/cron.log

# Copy application code

COPY . .

# Copy and make startup script executable

COPY start.sh .
RUN chmod +x ./start.sh

EXPOSE 3000

# Set the startup command to our new script

CMD ["./start.sh"]
With these steps complete, you can run docker compose up --build and your new, robust background processing system will be live.
