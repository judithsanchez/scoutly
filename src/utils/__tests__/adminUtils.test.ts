import {describe, it, expect} from 'vitest';
import {getAdminEmail, isAdminUser} from '../adminUtils';

describe('Admin Utils', () => {
	describe('isAdminUser', () => {
		it('should return true for admin email', () => {
			const result = isAdminUser('judithv.sanchezc@gmail.com');
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

		it('should be case insensitive', () => {
			const result = isAdminUser('JUDITHV.SANCHEZC@GMAIL.COM');
			expect(result).toBe(true);
		});

		it('should handle empty string', () => {
			const result = isAdminUser('');
			expect(result).toBe(false);
		});
	});

	describe('getAdminEmail', () => {
		it('should return the admin email', () => {
			const result = getAdminEmail();
			expect(result).toBe('judithv.sanchezc@gmail.com');
		});
	});
});
