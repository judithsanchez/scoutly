import {describe, it, expect, vi, beforeEach} from 'vitest';
import {UserCompanyPreference} from '@/models/UserCompanyPreference';
import {User} from '@/models/User';
import {Company} from '@/models/Company';
import {UserCompanyPreferenceService} from '../userCompanyPreferenceService';

// Mock the models
vi.mock('@/models/UserCompanyPreference', () => ({
	UserCompanyPreference: {
		find: vi.fn(),
		findOneAndUpdate: vi.fn(),
		findOne: vi.fn(),
		create: vi.fn(),
	},
}));

vi.mock('@/models/User', () => ({
	User: {
		findById: vi.fn(),
		findOne: vi.fn(),
	},
}));

vi.mock('@/models/Company', () => ({
	Company: {
		findOne: vi.fn(),
		findById: vi.fn(),
	},
}));

const mockUserCompanyPreference = vi.mocked(UserCompanyPreference);
const mockUser = vi.mocked(User);
const mockCompany = vi.mocked(Company);

describe('UserCompanyPreferenceService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('findByUserId', () => {
		it('should find all tracked company preferences for a given user', async () => {
			const userId = 'user123';
			const mockPreferences = [
				{
					_id: 'pref1',
					userId: 'user123',
					companyId: {
						_id: 'comp1',
						company: 'Test Company',
						companyID: 'test-company',
					},
					rank: 90,
					isTracking: true,
				},
			];

			(mockUserCompanyPreference.find as any).mockReturnValue({
				populate: vi.fn().mockResolvedValue(mockPreferences),
			});

			const result = await UserCompanyPreferenceService.findByUserId(userId);

			expect(mockUserCompanyPreference.find).toHaveBeenCalledWith({
				userId,
				isTracking: true,
			});
			expect(result).toEqual(mockPreferences);
		});

		it('should return empty array if user has no tracked preferences', async () => {
			const userId = 'user123';

			(mockUserCompanyPreference.find as any).mockReturnValue({
				populate: vi.fn().mockResolvedValue([]),
			});

			const result = await UserCompanyPreferenceService.findByUserId(userId);

			expect(result).toEqual([]);
		});
	});

	describe('upsert', () => {
		it('should create a new preference for a user and company', async () => {
			const userId = 'user123';
			const companyId = 'test-company';
			const data = {rank: 85, isTracking: true};

			const mockUser = {_id: 'user123'};
			const mockCompany = {_id: 'comp1', companyID: 'test-company'};
			const mockCreatedPreference = {
				_id: 'pref1',
				userId: 'user123',
				companyId: 'comp1',
				rank: 85,
				isTracking: true,
			};

			(User.findById as any).mockResolvedValue(mockUser);
			(Company.findOne as any).mockResolvedValue(mockCompany);
			(mockUserCompanyPreference.findOneAndUpdate as any).mockResolvedValue(
				mockCreatedPreference,
			);

			const result = await UserCompanyPreferenceService.upsert(
				userId,
				companyId,
				data,
			);

			expect(User.findById).toHaveBeenCalledWith(userId);
			expect(Company.findOne).toHaveBeenCalledWith({companyID: companyId});
			expect(mockUserCompanyPreference.findOneAndUpdate).toHaveBeenCalledWith(
				{userId: mockUser._id, companyId: mockCompany._id},
				{
					$set: {
						...data,
						userId: mockUser._id,
						companyId: mockCompany._id,
					},
				},
				{upsert: true, new: true, setDefaultsOnInsert: true},
			);
			expect(result).toEqual(mockCreatedPreference);
		});

		it('should update the rank of an existing preference', async () => {
			const userId = 'user123';
			const companyId = 'test-company';
			const data = {rank: 95};

			const mockUser = {_id: 'user123'};
			const mockCompany = {_id: 'comp1', companyID: 'test-company'};
			const mockUpdatedPreference = {
				_id: 'pref1',
				userId: 'user123',
				companyId: 'comp1',
				rank: 95,
				isTracking: true,
			};

			(User.findById as any).mockResolvedValue(mockUser);
			(Company.findOne as any).mockResolvedValue(mockCompany);
			(mockUserCompanyPreference.findOneAndUpdate as any).mockResolvedValue(
				mockUpdatedPreference,
			);

			const result = await UserCompanyPreferenceService.upsert(
				userId,
				companyId,
				data,
			);

			expect(result.rank).toBe(95);
		});

		it('should update the isTracking status of an existing preference', async () => {
			const userId = 'user123';
			const companyId = 'test-company';
			const data = {isTracking: false};

			const mockUser = {_id: 'user123'};
			const mockCompany = {_id: 'comp1', companyID: 'test-company'};
			const mockUpdatedPreference = {
				_id: 'pref1',
				userId: 'user123',
				companyId: 'comp1',
				rank: 80,
				isTracking: false,
			};

			(User.findById as any).mockResolvedValue(mockUser);
			(Company.findOne as any).mockResolvedValue(mockCompany);
			(mockUserCompanyPreference.findOneAndUpdate as any).mockResolvedValue(
				mockUpdatedPreference,
			);

			const result = await UserCompanyPreferenceService.upsert(
				userId,
				companyId,
				data,
			);

			expect(result.isTracking).toBe(false);
		});

		it('should throw an error if the user does not exist during creation', async () => {
			const userId = 'nonexistent-user';
			const companyId = 'test-company';
			const data = {rank: 85, isTracking: true};

			(User.findById as any).mockResolvedValue(null);
			(Company.findOne as any).mockResolvedValue({_id: 'comp1'});

			await expect(
				UserCompanyPreferenceService.upsert(userId, companyId, data),
			).rejects.toThrow('User or Company not found for preference update.');
		});

		it('should throw an error if the company does not exist during creation', async () => {
			const userId = 'user123';
			const companyId = 'nonexistent-company';
			const data = {rank: 85, isTracking: true};

			(User.findById as any).mockResolvedValue({_id: 'user123'});
			(Company.findOne as any).mockResolvedValue(null);

			await expect(
				UserCompanyPreferenceService.upsert(userId, companyId, data),
			).rejects.toThrow('User or Company not found for preference update.');
		});
	});
});
