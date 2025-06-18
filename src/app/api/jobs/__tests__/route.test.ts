import {describe, it, expect, vi, beforeEach} from 'vitest';
import {POST} from '../route';
import {UserService} from '@/services/userService';
import {CompanyService} from '@/services/companyService';
import {JobMatchingOrchestrator} from '@/services/jobMatchingOrchestrator';
import dbConnect from '@/middleware/database';
import {NextRequest} from 'next/server';
import {WorkModel} from '@/models/Company';

vi.mock('@/services/userService');
vi.mock('@/services/companyService');
vi.mock('@/services/jobMatchingOrchestrator');
vi.mock('@/middleware/database');
vi.mock('@/utils/logger', () => ({
	Logger: vi.fn().mockImplementation(() => ({
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		success: vi.fn(),
	})),
}));

const mockUserService = vi.mocked(UserService);
const mockCompanyService = vi.mocked(CompanyService);
const mockJobMatchingOrchestrator = vi.mocked(JobMatchingOrchestrator);
const mockDbConnect = vi.mocked(dbConnect);

describe('/api/jobs', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDbConnect.mockResolvedValue({} as any);
	});

	describe('POST /api/jobs', () => {
		const validRequestBody = {
			credentials: {
				gmail: 'test@example.com',
			},
			companyIds: ['tech-corp', 'startup-co'],
			cvUrl: 'https://drive.google.com/file/d/test-cv-id/view',
			candidateInfo: {
				logistics: {
					currentResidence: {
						city: 'San Francisco',
						country: 'United States',
						countryCode: 'US',
						timezone: 'America/Los_Angeles',
					},
					willingToRelocate: true,
					workAuthorization: [
						{
							region: 'United States',
							regionCode: 'US',
							status: 'Citizen',
						},
					],
				},
				languages: [
					{
						language: 'English',
						level: 'Native',
					},
				],
				preferences: {
					careerGoals: ['Senior Engineer Role', 'Tech Leadership'],
					jobTypes: ['Full-time'],
					workEnvironments: ['Remote', 'Hybrid'],
					companySizes: ['Start-ups', 'Mid-size (51-1000)'],
					exclusions: {
						industries: ['Gambling'],
						technologies: ['PHP'],
						roleTypes: ['100% on-call support'],
					},
				},
			},
		};

		it('should process job matching successfully', async () => {
			const mockUser = {
				_id: '507f1f77bcf86cd799439011',
				email: 'test@example.com',
			};

			const mockCompanies = [
				{
					_id: '507f1f77bcf86cd799439012',
					companyID: 'tech-corp',
					company: 'Tech Corp',
					careers_url: 'https://techcorp.com/careers',
					work_model: WorkModel.HYBRID,
					headquarters: 'San Francisco, CA',
					office_locations: ['San Francisco'],
					fields: ['Technology'],
					openToApplication: true,
					ranking: 85,
				},
				{
					_id: '507f1f77bcf86cd799439013',
					companyID: 'startup-co',
					company: 'StartupCo',
					careers_url: 'https://startupco.com/jobs',
					work_model: WorkModel.FULLY_REMOTE,
					headquarters: 'Austin, TX',
					office_locations: ['Austin'],
					fields: ['AI', 'Machine Learning'],
					openToApplication: true,
					ranking: 90,
				},
			];

			const mockJobResults = [
				{
					title: 'Senior Software Engineer',
					url: 'https://techcorp.com/job1',
					location: 'San Francisco, CA',
					suitabilityScore: 85,
					techStack: ['React', 'Node.js', 'TypeScript'],
					experienceLevel: 'Senior',
					goodFitReasons: ['Strong technical match', 'Location preference'],
				},
				{
					title: 'Frontend Developer',
					url: 'https://startupco.com/job2',
					location: 'Remote',
					suitabilityScore: 78,
					techStack: ['Vue.js', 'Python', 'AWS'],
					experienceLevel: 'Mid-level',
					goodFitReasons: ['Remote work option', 'Growth opportunity'],
				},
			];

			mockUserService.getOrCreateUser.mockResolvedValue(mockUser as any);

			mockCompanyService.getCompanyById
				.mockResolvedValueOnce(mockCompanies[0] as any)
				.mockResolvedValueOnce(mockCompanies[1] as any);

			const mockOrchestrator = {
				orchestrateJobMatching: vi
					.fn()
					.mockResolvedValueOnce([mockJobResults[0]])
					.mockResolvedValueOnce([mockJobResults[1]]),
			};
			mockJobMatchingOrchestrator.mockImplementation(
				() => mockOrchestrator as any,
			);

			const request = new NextRequest('http://localhost:3000/api/jobs', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(validRequestBody),
			});

			const response = await POST(request);
			const responseData = await response.json();

			expect(response.status).toBe(200);
			expect(responseData).toEqual({
				results: [
					{
						company: 'Tech Corp',
						processed: true,
						results: [mockJobResults[0]],
					},
					{
						company: 'StartupCo',
						processed: true,
						results: [mockJobResults[1]],
					},
				],
			});

			expect(mockDbConnect).toHaveBeenCalledOnce();
			expect(mockUserService.getOrCreateUser).toHaveBeenCalledWith(
				'test@example.com',
			);
			expect(mockCompanyService.getCompanyById).toHaveBeenCalledTimes(2);
			expect(mockCompanyService.getCompanyById).toHaveBeenCalledWith(
				'tech-corp',
			);
			expect(mockCompanyService.getCompanyById).toHaveBeenCalledWith(
				'startup-co',
			);
			expect(mockOrchestrator.orchestrateJobMatching).toHaveBeenCalledTimes(2);
		});

		it('should handle company not found', async () => {
			const mockUser = {
				_id: '507f1f77bcf86cd799439011',
				email: 'test@example.com',
			};

			mockUserService.getOrCreateUser.mockResolvedValue(mockUser as any);

			mockCompanyService.getCompanyById.mockResolvedValue(null);

			const mockOrchestrator = {
				orchestrateJobMatching: vi.fn(),
			};
			mockJobMatchingOrchestrator.mockImplementation(
				() => mockOrchestrator as any,
			);

			const requestBody = {
				...validRequestBody,
				companyIds: ['non-existent-company'],
			};

			const request = new NextRequest('http://localhost:3000/api/jobs', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			const response = await POST(request);
			const responseData = await response.json();

			expect(response.status).toBe(200);
			expect(responseData).toEqual({
				results: [
					{
						company: 'non-existent-company',
						processed: false,
						error: 'Company not found in the database',
						results: [],
					},
				],
			});

			expect(mockCompanyService.getCompanyById).toHaveBeenCalledWith(
				'non-existent-company',
			);
			expect(mockOrchestrator.orchestrateJobMatching).not.toHaveBeenCalled();
		});

		it('should handle mixed success and failure', async () => {
			const mockUser = {
				_id: '507f1f77bcf86cd799439011',
				email: 'test@example.com',
			};

			const mockCompany = {
				_id: '507f1f77bcf86cd799439012',
				companyID: 'tech-corp',
				company: 'Tech Corp',
				careers_url: 'https://techcorp.com/careers',
				work_model: WorkModel.HYBRID,
			};

			const mockJobResults = [
				{
					title: 'Senior Software Engineer',
					url: 'https://techcorp.com/job1',
					suitabilityScore: 85,
				},
			];

			mockUserService.getOrCreateUser.mockResolvedValue(mockUser as any);

			mockCompanyService.getCompanyById
				.mockResolvedValueOnce(mockCompany as any)
				.mockResolvedValueOnce(null);

			const mockOrchestrator = {
				orchestrateJobMatching: vi.fn().mockResolvedValue([mockJobResults[0]]),
			};

			mockJobMatchingOrchestrator.mockImplementation(
				() => mockOrchestrator as any,
			);

			const requestBody = {
				...validRequestBody,
				companyIds: ['tech-corp', 'non-existent-company'],
			};

			const request = new NextRequest('http://localhost:3000/api/jobs', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			const response = await POST(request);
			const responseData = await response.json();

			expect(response.status).toBe(200);
			expect(responseData.results).toHaveLength(2);
			expect(responseData.results[0]).toEqual({
				company: 'Tech Corp',
				processed: true,
				results: [mockJobResults[0]],
			});
			expect(responseData.results[1]).toEqual({
				company: 'non-existent-company',
				processed: false,
				error: 'Company not found in the database',
				results: [],
			});
		});

		it('should return 400 for missing required fields', async () => {
			const invalidRequestBody = {
				credentials: {
					gmail: 'test@example.com',
				},
			};

			const request = new NextRequest('http://localhost:3000/api/jobs', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(invalidRequestBody),
			});

			const response = await POST(request);
			const responseData = await response.json();

			expect(response.status).toBe(400);
			expect(responseData).toEqual({
				error: 'Validation failed',
				details: [
					'cvUrl is required',
					'candidateInfo is required',
					'companyIds array with at least one company is required',
				],
				message:
					'cvUrl is required, candidateInfo is required, companyIds array with at least one company is required',
			});
		});

		it('should return 400 for empty companyIds array', async () => {
			const invalidRequestBody = {
				...validRequestBody,
				companyIds: [],
			};

			const request = new NextRequest('http://localhost:3000/api/jobs', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(invalidRequestBody),
			});

			const response = await POST(request);
			const responseData = await response.json();

			expect(response.status).toBe(400);
			expect(responseData).toEqual({
				error: 'Validation failed',
				details: ['companyIds array with at least one company is required'],
				message: 'companyIds array with at least one company is required',
			});
		});

		it('should return 400 for missing gmail', async () => {
			const invalidRequestBody = {
				...validRequestBody,
				credentials: {},
			};

			const request = new NextRequest('http://localhost:3000/api/jobs', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(invalidRequestBody),
			});

			const response = await POST(request);
			const responseData = await response.json();

			expect(response.status).toBe(400);
			expect(responseData).toEqual({
				error: 'Validation failed',
				details: ['gmail credentials are required'],
				message: 'gmail credentials are required',
			});
		});
	});
});
