/**
 * Admin utilities for Scoutly admin panel
 * Provides admin access control and configuration
 */

/**
 * Admin email address - only this email has admin access
 */
const ADMIN_EMAIL = 'judithv.sanchezc@gmail.com';

/**
 * Check if a user is an admin based on their email
 * @param email - User's email address
 * @returns true if user is admin, false otherwise
 */
export function isAdminUser(email: string | null | undefined): boolean {
	if (!email) {
		return false;
	}

	return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * Get the admin email address
 * @returns The admin email address
 */
export function getAdminEmail(): string {
	return ADMIN_EMAIL;
}
