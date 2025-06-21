import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {User} from '@/models/User';
import {Company} from '@/models/Company';
import {UserCompanyPreference} from '@/models/UserCompanyPreference';
import {JobQueue, JobStatus} from '@/models/JobQueue';
import {queueDueJobs} from '../scheduler';

// Mock all dependencies
vi.mock('@/middleware/database');
vi.mock('@/models/User');
vi.mock('@/models/Company');
vi.mock('@/models/UserCompanyPreference');
vi.mock('@/models/JobQueue');
vi.mock('@/utils/logger');

describe('Scoutly Scheduler Logic', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should queue a job for a high-rank company if its cooldown has passed', async () => {
		// Setup: Mock a User, a Company with lastSuccessfulScrape from 13 hours ago,
		// and a UserCompanyPreference linking them with a rank of 95
		const mockUser = {_id: 'user1', email: 'test@example.com'};
		const mockCompany = {
			_id: 'company1',
			company: 'Test Company',
			companyID: 'TEST123',
			lastSuccessfulScrape: new Date(Date.now() - 13 * 60 * 60 * 1000), // 13 hours ago
		};
		const mockPreference = {
			userId: 'user1',
			companyId: mockCompany,
			rank: 95,
			isTracking: true,
		};

		vi.mocked(User.find).mockResolvedValue([mockUser]);
		vi.mocked(UserCompanyPreference.find).mockReturnValue({
			populate: vi.fn().mockResolvedValue([mockPreference]),
		} as any);
		vi.mocked(JobQueue.findOne).mockResolvedValue(null); // No existing job
		vi.mocked(JobQueue.create).mockResolvedValue({
			_id: 'job1',
			companyId: 'company1',
			status: JobStatus.PENDING,
		} as any);

		// Execute: Run the scheduler's main function
		await queueDueJobs();

		// Assert: Verify that JobQueue.create was called with the correct companyId and 'pending' status
		expect(JobQueue.create).toHaveBeenCalledWith({
			companyId: 'company1',
			status: JobStatus.PENDING,
		});
	});

	it('should NOT queue a job for a high-rank company if it was scraped recently', async () => {
		// Setup: Mock a Company with lastSuccessfulScrape from 2 hours ago and a rank of 95
		const mockUser = {_id: 'user1', email: 'test@example.com'};
		const mockCompany = {
			_id: 'company1',
			company: 'Test Company',
			companyID: 'TEST123',
			lastSuccessfulScrape: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
		};
		const mockPreference = {
			userId: 'user1',
			companyId: mockCompany,
			rank: 95,
			isTracking: true,
		};

		vi.mocked(User.find).mockResolvedValue([mockUser]);
		vi.mocked(UserCompanyPreference.find).mockReturnValue({
			populate: vi.fn().mockResolvedValue([mockPreference]),
		} as any);

		// Execute: Run the scheduler's main function
		await queueDueJobs();

		// Assert: Verify that JobQueue.create was NOT called
		expect(JobQueue.create).not.toHaveBeenCalled();
	});

	it('should queue a job for a low-rank company only after its long cooldown has passed', async () => {
		// Setup: Mock a Company with lastSuccessfulScrape from 8 days ago and a rank of 55
		const mockUser = {_id: 'user1', email: 'test@example.com'};
		const mockCompany = {
			_id: 'company1',
			company: 'Test Company',
			companyID: 'TEST123',
			lastSuccessfulScrape: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
		};
		const mockPreference = {
			userId: 'user1',
			companyId: mockCompany,
			rank: 55,
			isTracking: true,
		};

		vi.mocked(User.find).mockResolvedValue([mockUser]);
		vi.mocked(UserCompanyPreference.find).mockReturnValue({
			populate: vi.fn().mockResolvedValue([mockPreference]),
		} as any);
		vi.mocked(JobQueue.findOne).mockResolvedValue(null); // No existing job
		vi.mocked(JobQueue.create).mockResolvedValue({
			_id: 'job2',
			companyId: 'company1',
			status: JobStatus.PENDING,
		} as any);

		// Execute: Run the scheduler's main function
		await queueDueJobs();

		// Assert: Verify that JobQueue.create was called
		expect(JobQueue.create).toHaveBeenCalledWith({
			companyId: 'company1',
			status: JobStatus.PENDING,
		});
	});

	it('should NOT queue a job if one is already pending for that company', async () => {
		// Setup: Mock a company that is due for a scrape
		const mockUser = {_id: 'user1', email: 'test@example.com'};
		const mockCompany = {
			_id: 'company1',
			company: 'Test Company',
			companyID: 'TEST123',
			lastSuccessfulScrape: new Date(Date.now() - 13 * 60 * 60 * 1000), // 13 hours ago
		};
		const mockPreference = {
			userId: 'user1',
			companyId: mockCompany,
			rank: 95,
			isTracking: true,
		};

		vi.mocked(User.find).mockResolvedValue([mockUser]);
		vi.mocked(UserCompanyPreference.find).mockReturnValue({
			populate: vi.fn().mockResolvedValue([mockPreference]),
		} as any);

		// Mock JobQueue.findOne to return an existing pending job for that company
		vi.mocked(JobQueue.findOne).mockResolvedValue({
			_id: 'job1',
			companyId: 'company1',
			status: JobStatus.PENDING,
		});

		// Execute: Run the scheduler's main function
		await queueDueJobs();

		// Assert: Verify that JobQueue.create was NOT called
		expect(JobQueue.create).not.toHaveBeenCalled();
	});

	it('should handle multiple users and companies correctly', async () => {
		// Setup: Mock multiple users with different companies and preferences
		const mockUsers = [
			{_id: 'user1', email: 'user1@example.com'},
			{_id: 'user2', email: 'user2@example.com'},
		];

		const mockCompany1 = {
			_id: 'company1',
			company: 'Company 1',
			companyID: 'COMP1',
			lastSuccessfulScrape: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
		};

		const mockCompany2 = {
			_id: 'company2',
			company: 'Company 2',
			companyID: 'COMP2',
			lastSuccessfulScrape: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
		};

		vi.mocked(User.find).mockResolvedValue(mockUsers);

		// Mock different preferences for different users
		vi.mocked(UserCompanyPreference.find)
			.mockReturnValueOnce({
				populate: vi
					.fn()
					.mockResolvedValue([
						{
							userId: 'user1',
							companyId: mockCompany1,
							rank: 85,
							isTracking: true,
						},
					]),
			} as any)
			.mockReturnValueOnce({
				populate: vi
					.fn()
					.mockResolvedValue([
						{
							userId: 'user2',
							companyId: mockCompany2,
							rank: 95,
							isTracking: true,
						},
					]),
			} as any);

		vi.mocked(JobQueue.findOne).mockResolvedValue(null); // No existing jobs
		vi.mocked(JobQueue.create).mockResolvedValue({
			_id: 'job3',
			companyId: 'company1',
			status: JobStatus.PENDING,
		} as any);

		// Execute: Run the scheduler's main function
		await queueDueJobs();

		// Assert: Only company1 should be queued (company2 was scraped too recently)
		expect(JobQueue.create).toHaveBeenCalledTimes(1);
		expect(JobQueue.create).toHaveBeenCalledWith({
			companyId: 'company1',
			status: JobStatus.PENDING,
		});
	});
});
