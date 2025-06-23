import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {getAdminEmail, isAdminUser} from '../adminUtils';

// Mock environment variables
const mockEnv = {
	ADMIN_EMAIL: 'judithv.sanchezc@gmail.com',
};

describe('Admin Utils', () => {
	beforeEach(() => {
		// Reset mocks
		vi.clearAllMocks();

		// Mock process.env
		vi.stubGlobal('process', {
			env: mockEnv,
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	describe('isAdminUser', () => {
		it('should return true for environment admin email (case insensitive)', () => {
			const result = isAdminUser('judithv.sanchezc@gmail.com');
			expect(result).toBe(true);
		});

		it('should return true for environment admin email with different case', () => {
			const result = isAdminUser('JUDITHV.SANCHEZC@GMAIL.COM');
			expect(result).toBe(true);
		});

		it('should return false for non-admin email', () => {
			const result = isAdminUser('user@example.com');
			expect(result).toBe(false);
		});

		it('should return false for null email', () => {
			const result = isAdminUser(null);
			expect(result).toBe(false);
		});

		it('should return false for undefined email', () => {
			const result = isAdminUser(undefined);
			expect(result).toBe(false);
		});

		it('should return false for empty string', () => {
			const result = isAdminUser('');
			expect(result).toBe(false);
		});

		it('should handle missing ADMIN_EMAIL environment variable', () => {
			vi.stubGlobal('process', {
				env: {},
			});

			const result = isAdminUser('judithv.sanchezc@gmail.com');
			expect(result).toBe(false);
		});
	});

	describe('getAdminEmail', () => {
		it('should return admin email from environment variable', () => {
			const result = getAdminEmail();
			expect(result).toBe('judithv.sanchezc@gmail.com');
		});

		it('should handle missing ADMIN_EMAIL environment variable', () => {
			vi.stubGlobal('process', {
				env: {},
			});

			const result = getAdminEmail();
			expect(result).toBe(null);
		});
	});
});
