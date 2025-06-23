/**
 * Admin utilities for Scoutly admin panel
 * Provides admin access control and configuration
 * Supports both environment variable bootstrap admin and database admins
 */

import AdminUser from '@/models/AdminUser';

/**
 * Check if a user is a bootstrap admin (from environment variable)
 * @param email - User's email address
 * @returns true if user is bootstrap admin, false otherwise
 */
export function isBootstrapAdmin(email: string | null | undefined): boolean {
	if (!email || !process.env.ADMIN_EMAIL) {
		return false;
	}

	return email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
}

/**
 * Check if a user is a database admin
 * @param email - User's email address
 * @returns Promise<boolean> - true if user is database admin, false otherwise
 */
export async function isDatabaseAdmin(
	email: string | null | undefined,
): Promise<boolean> {
	if (!email) {
		return false;
	}

	try {
		const adminUser = await AdminUser.findOne({
			email: email.toLowerCase(),
			isActive: true,
		});

		return !!adminUser;
	} catch (error) {
		console.error('Error checking database admin status:', error);
		return false;
	}
}

/**
 * Check if a user is an admin (bootstrap or database admin)
 * @param email - User's email address
 * @returns Promise<boolean> - true if user is admin, false otherwise
 */
export async function isAdminUserAsync(
	email: string | null | undefined,
): Promise<boolean> {
	if (!email) {
		return false;
	}

	// Check bootstrap admin first (faster)
	if (isBootstrapAdmin(email)) {
		return true;
	}

	// Check database admin
	return await isDatabaseAdmin(email);
}

/**
 * Synchronous check for admin status (only checks bootstrap admin)
 * Use this for cases where you can't use async/await
 * @param email - User's email address
 * @returns true if user is bootstrap admin, false otherwise
 */
export function isAdminUser(email: string | null | undefined): boolean {
	return isBootstrapAdmin(email);
}

/**
 * Get the bootstrap admin email address from environment
 * @returns The bootstrap admin email address or null if not set
 */
export function getAdminEmail(): string | null {
	return process.env.ADMIN_EMAIL || null;
}

/**
 * Create a new admin user in the database
 * @param email - Email of the new admin
 * @param role - Role of the new admin
 * @param createdBy - Email of the admin creating this user
 * @returns Promise<boolean> - true if created successfully, false otherwise
 */
export async function createAdminUser(
	email: string,
	role: 'super_admin' | 'admin' | 'moderator' = 'admin',
	createdBy: string,
	permissions: string[] = [],
): Promise<boolean> {
	try {
		const existingAdmin = await AdminUser.findOne({email: email.toLowerCase()});
		if (existingAdmin) {
			return false; // Admin already exists
		}

		const newAdmin = new AdminUser({
			email: email.toLowerCase(),
			role,
			createdBy: createdBy.toLowerCase(),
			permissions,
			isActive: true,
		});

		await newAdmin.save();
		return true;
	} catch (error) {
		console.error('Error creating admin user:', error);
		return false;
	}
}

/**
 * Promote an existing user to admin by adding admin record
 * Does not modify the existing user record
 * @param email - Email of the user to promote
 * @param role - Role to assign
 * @param createdBy - Email of the admin promoting this user
 * @returns Promise<boolean> - true if promoted successfully, false otherwise
 */
export async function promoteUserToAdmin(
	email: string,
	role: 'super_admin' | 'admin' | 'moderator' = 'admin',
	createdBy: string,
): Promise<boolean> {
	return await createAdminUser(email, role, createdBy);
}
