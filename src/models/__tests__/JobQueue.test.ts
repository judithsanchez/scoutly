import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import mongoose from 'mongoose';
import {JobQueue, JobStatus, type IJobQueue} from '../JobQueue';
import {Company} from '../Company';

describe('JobQueue Model', () => {
	beforeEach(async () => {
		// Connect to test database
		if (mongoose.connection.readyState === 0) {
			await mongoose.connect('mongodb://localhost:27017/scoutly-test');
		}
	});

	afterEach(async () => {
		// Clean up test data
		await JobQueue.deleteMany({});
		await Company.deleteMany({});
	});

	describe('Model Creation', () => {
		it('should create a job queue entry with required fields', async () => {
			// Create a test company first
			const company = await Company.create({
				companyID: 'test-company',
				company: 'Test Company',
				careers_url: 'https://test.com/careers',
				selector: '.jobs',
				work_model: 'FULLY_REMOTE',
				headquarters: 'Test City',
				office_locations: [],
				fields: ['tech'],
				openToApplication: false,
				isProblematic: false,
				scrapeErrors: [],
			});

			const jobData = {
				companyId: company._id,
				status: JobStatus.PENDING,
			};

			const job = await JobQueue.create(jobData);

			expect(job).toBeDefined();
			expect(job.companyId.toString()).toBe(company._id.toString());
			expect(job.status).toBe(JobStatus.PENDING);
			expect(job.retryCount).toBe(0); // default value
			expect(job.createdAt).toBeInstanceOf(Date);
		});

		it('should enforce required fields', async () => {
			const invalidJob = {
				status: JobStatus.PENDING,
				// missing companyId
			};

			await expect(JobQueue.create(invalidJob)).rejects.toThrow();
		});
	});

	describe('Job Status Enum', () => {
		it('should accept valid status values', async () => {
			const company = await Company.create({
				companyID: 'test-company-2',
				company: 'Test Company 2',
				careers_url: 'https://test2.com/careers',
				selector: '.jobs',
				work_model: 'FULLY_REMOTE',
				headquarters: 'Test City',
				office_locations: [],
				fields: ['tech'],
				openToApplication: false,
				isProblematic: false,
				scrapeErrors: [],
			});

			const statuses = [
				JobStatus.PENDING,
				JobStatus.PROCESSING,
				JobStatus.COMPLETED,
				JobStatus.FAILED,
			];

			for (const status of statuses) {
				const job = await JobQueue.create({
					companyId: company._id,
					status,
				});
				expect(job.status).toBe(status);
			}
		});

		it('should reject invalid status values', async () => {
			const company = await Company.create({
				companyID: 'test-company-3',
				company: 'Test Company 3',
				careers_url: 'https://test3.com/careers',
				selector: '.jobs',
				work_model: 'FULLY_REMOTE',
				headquarters: 'Test City',
				office_locations: [],
				fields: ['tech'],
				openToApplication: false,
				isProblematic: false,
				scrapeErrors: [],
			});

			const invalidJob = {
				companyId: company._id,
				status: 'INVALID_STATUS',
			};

			await expect(JobQueue.create(invalidJob)).rejects.toThrow();
		});
	});

	describe('Optional Fields', () => {
		it('should handle optional fields correctly', async () => {
			const company = await Company.create({
				companyID: 'test-company-4',
				company: 'Test Company 4',
				careers_url: 'https://test4.com/careers',
				selector: '.jobs',
				work_model: 'FULLY_REMOTE',
				headquarters: 'Test City',
				office_locations: [],
				fields: ['tech'],
				openToApplication: false,
				isProblematic: false,
				scrapeErrors: [],
			});

			const now = new Date();
			const job = await JobQueue.create({
				companyId: company._id,
				status: JobStatus.FAILED,
				lastAttemptAt: now,
				completedAt: now,
				errorMessage: 'Test error',
			});

			expect(job.lastAttemptAt).toEqual(now);
			expect(job.completedAt).toEqual(now);
			expect(job.errorMessage).toBe('Test error');
		});
	});

	describe('Default Values', () => {
		it('should set retryCount to 0 by default', async () => {
			const company = await Company.create({
				companyID: 'test-company-5',
				company: 'Test Company 5',
				careers_url: 'https://test5.com/careers',
				selector: '.jobs',
				work_model: 'FULLY_REMOTE',
				headquarters: 'Test City',
				office_locations: [],
				fields: ['tech'],
				openToApplication: false,
				isProblematic: false,
				scrapeErrors: [],
			});

			const job = await JobQueue.create({
				companyId: company._id,
				status: JobStatus.PENDING,
			});

			expect(job.retryCount).toBe(0);
		});
	});
});
