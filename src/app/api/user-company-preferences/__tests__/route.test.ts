import {describe, it, expect, vi, beforeEach} from 'vitest';
import {GET, POST} from '../route';
import {PUT, DELETE} from '../[companyId]/route';
import {NextRequest} from 'next/server';
import {UserCompanyPreferenceService} from '@/services/userCompanyPreferenceService';
import {UserService} from '@/services/userService';
import dbConnect from '@/middleware/database';

// Mock the service and database
vi.mock('@/services/userCompanyPreferenceService');
vi.mock('@/services/userService');
vi.mock('@/middleware/database');
vi.mock('@/utils/enhancedLogger', () => ({
	EnhancedLogger: {
		getLogger: vi.fn().mockReturnValue({
			info: vi.fn(),
			error: vi.fn(),
			warn: vi.fn(),
			debug: vi.fn(),
		}),
	},
}));

const mockUserCompanyPreferenceService = vi.mocked(
	UserCompanyPreferenceService,
);
const mockUserService = vi.mocked(UserService);
const mockDbConnect = vi.mocked(dbConnect);

describe('/api/user-company-preferences', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDbConnect.mockResolvedValue({} as any);

		// Mock getUserByEmail to return a user with _id
		mockUserService.getUserByEmail.mockResolvedValue({
			_id: 'user123',
			email: 'judithv.sanchezc@gmail.com',
		} as any);
	});

	describe('GET /api/user-company-preferences', () => {
		it('should return only tracked companies for the current user', async () => {
			const mockTrackedCompanies = [
				{
					_id: 'pref1',
					userId: 'user123',
					companyId: {
						_id: 'comp1',
						companyID: 'booking',
						company: 'Booking.com',
						careers_url: 'https://careers.booking.com',
						logo_url: 'https://booking.com/logo.png',
					},
					rank: 90,
					isTracking: true,
				},
			];

			mockUserCompanyPreferenceService.findByUserId.mockResolvedValue(
				mockTrackedCompanies as any,
			);

			const request = new NextRequest(
				'http://localhost:3000/api/user-company-preferences',
			);
			const response = await GET(request);

			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data.companies).toHaveLength(1);
			expect(data.companies[0]).toMatchObject({
				_id: 'comp1',
				companyID: 'booking',
				company: 'Booking.com',
				userPreference: {
					rank: 90,
					isTracking: true,
				},
			});
			expect(
				mockUserCompanyPreferenceService.findByUserId,
			).toHaveBeenCalledWith('user123');
		});

		it('should return empty array if user has no tracked preferences', async () => {
			mockUserCompanyPreferenceService.findByUserId.mockResolvedValue([]);

			const request = new NextRequest(
				'http://localhost:3000/api/user-company-preferences',
			);
			const response = await GET(request);

			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data.companies).toEqual([]);
		});

		it('should handle service errors gracefully', async () => {
			mockUserCompanyPreferenceService.findByUserId.mockRejectedValue(
				new Error('Database error'),
			);

			const request = new NextRequest(
				'http://localhost:3000/api/user-company-preferences',
			);
			const response = await GET(request);

			expect(response.status).toBe(500);

			const data = await response.json();
			expect(data.error).toBeDefined();
		});
	});

	describe('POST /api/user-company-preferences', () => {
		it('should create a new preference and return 201 Created', async () => {
			const mockCreatedPreference = {
				_id: 'pref1',
				userId: 'judithv.sanchezc@gmail.com',
				companyId: 'comp1',
				rank: 85,
				isTracking: true,
			};

			mockUserCompanyPreferenceService.upsert.mockResolvedValue(
				mockCreatedPreference as any,
			);

			const requestBody = {
				companyId: 'booking',
				rank: 85,
				isTracking: true,
			};

			const request = new NextRequest(
				'http://localhost:3000/api/user-company-preferences',
				{
					method: 'POST',
					body: JSON.stringify(requestBody),
					headers: {
						'Content-Type': 'application/json',
					},
				},
			);

			const response = await POST(request);

			expect(response.status).toBe(201);

			const data = await response.json();
			expect(data.success).toBe(true);
			expect(data.preference).toEqual(mockCreatedPreference);

			expect(mockUserCompanyPreferenceService.upsert).toHaveBeenCalledWith(
				'user123',
				'booking',
				{rank: 85, isTracking: true},
			);
		});

		it('should handle missing required fields', async () => {
			const requestBody = {
				rank: 85,
				// missing companyId
			};

			const request = new NextRequest(
				'http://localhost:3000/api/user-company-preferences',
				{
					method: 'POST',
					body: JSON.stringify(requestBody),
					headers: {
						'Content-Type': 'application/json',
					},
				},
			);

			const response = await POST(request);

			expect(response.status).toBe(400);

			const data = await response.json();
			expect(data.error).toContain('companyId');
		});

		it('should handle service errors during creation', async () => {
			mockUserCompanyPreferenceService.upsert.mockRejectedValue(
				new Error('User or Company not found'),
			);

			const requestBody = {
				companyId: 'nonexistent',
				rank: 85,
				isTracking: true,
			};

			const request = new NextRequest(
				'http://localhost:3000/api/user-company-preferences',
				{
					method: 'POST',
					body: JSON.stringify(requestBody),
					headers: {
						'Content-Type': 'application/json',
					},
				},
			);

			const response = await POST(request);

			expect(response.status).toBe(500);

			const data = await response.json();
			expect(data.error).toBeDefined();
		});
	});
});

describe('/api/user-company-preferences/[companyId]', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDbConnect.mockResolvedValue({} as any);
	});

	describe('PUT /api/user-company-preferences/[companyId]', () => {
		it('should update the ranking for a specific company', async () => {
			const mockUpdatedPreference = {
				_id: 'pref1',
				userId: 'judithv.sanchezc@gmail.com',
				companyId: 'comp1',
				rank: 95,
				isTracking: true,
			};

			mockUserCompanyPreferenceService.upsert.mockResolvedValue(
				mockUpdatedPreference as any,
			);

			const requestBody = {
				rank: 95,
			};

			const request = new NextRequest(
				'http://localhost:3000/api/user-company-preferences/booking',
				{
					method: 'PUT',
					body: JSON.stringify(requestBody),
					headers: {
						'Content-Type': 'application/json',
					},
				},
			);

			const response = await PUT(request, {params: {companyId: 'booking'}});

			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data.success).toBe(true);
			expect(data.preference).toEqual(mockUpdatedPreference);

			expect(mockUserCompanyPreferenceService.upsert).toHaveBeenCalledWith(
				'user123',
				'booking',
				{rank: 95},
			);
		});

		it('should allow untracking a company by setting isTracking to false', async () => {
			const mockUpdatedPreference = {
				_id: 'pref1',
				userId: 'judithv.sanchezc@gmail.com',
				companyId: 'comp1',
				rank: 85,
				isTracking: false,
			};

			mockUserCompanyPreferenceService.upsert.mockResolvedValue(
				mockUpdatedPreference as any,
			);

			const requestBody = {
				isTracking: false,
			};

			const request = new NextRequest(
				'http://localhost:3000/api/user-company-preferences/booking',
				{
					method: 'PUT',
					body: JSON.stringify(requestBody),
					headers: {
						'Content-Type': 'application/json',
					},
				},
			);

			const response = await PUT(request, {params: {companyId: 'booking'}});

			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data.success).toBe(true);
			expect(data.preference.isTracking).toBe(false);

			expect(mockUserCompanyPreferenceService.upsert).toHaveBeenCalledWith(
				'user123',
				'booking',
				{isTracking: false},
			);
		});

		it('should handle invalid company ID', async () => {
			mockUserCompanyPreferenceService.upsert.mockRejectedValue(
				new Error('User or Company not found'),
			);

			const requestBody = {
				rank: 90,
			};

			const request = new NextRequest(
				'http://localhost:3000/api/user-company-preferences/invalid',
				{
					method: 'PUT',
					body: JSON.stringify(requestBody),
					headers: {
						'Content-Type': 'application/json',
					},
				},
			);

			const response = await PUT(request, {params: {companyId: 'invalid'}});

			expect(response.status).toBe(500);

			const data = await response.json();
			expect(data.error).toBeDefined();
		});
	});

	describe('DELETE /api/user-company-preferences/[companyId]', () => {
		it('should delete a preference by setting isTracking to false', async () => {
			const mockUpdatedPreference = {
				_id: 'pref1',
				userId: 'judithv.sanchezc@gmail.com',
				companyId: 'comp1',
				rank: 85,
				isTracking: false,
			};

			mockUserCompanyPreferenceService.upsert.mockResolvedValue(
				mockUpdatedPreference as any,
			);

			const request = new NextRequest(
				'http://localhost:3000/api/user-company-preferences/booking',
				{
					method: 'DELETE',
				},
			);

			const response = await DELETE(request, {params: {companyId: 'booking'}});

			expect(response.status).toBe(200);

			const data = await response.json();
			expect(data.success).toBe(true);

			expect(mockUserCompanyPreferenceService.upsert).toHaveBeenCalledWith(
				'user123',
				'booking',
				{isTracking: false},
			);
		});

		it('should handle service errors during deletion', async () => {
			mockUserCompanyPreferenceService.upsert.mockRejectedValue(
				new Error('User or Company not found'),
			);

			const request = new NextRequest(
				'http://localhost:3000/api/user-company-preferences/booking',
				{
					method: 'DELETE',
				},
			);

			const response = await DELETE(request, {params: {companyId: 'booking'}});

			expect(response.status).toBe(500);

			const data = await response.json();
			expect(data.error).toBeDefined();
		});
	});
});
