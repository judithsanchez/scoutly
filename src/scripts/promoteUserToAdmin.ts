/**
 * Script to promote existing user to admin
 * This script adds admin privileges to your existing user record without modifying it
 */

import {connectToDatabase} from '@/lib/mongodb';
import AdminUser from '@/models/AdminUser';
import mongoose from 'mongoose';

async function promoteExistingUserToAdmin() {
	try {
		console.log('Connecting to database...');
		await connectToDatabase();

		// Wait a bit for connection to stabilize
		await new Promise(resolve => setTimeout(resolve, 1000));

		console.log('Database connected successfully!');

		const userEmail = 'judithv.sanchezc@gmail.com';
		const bootstrapAdmin = process.env.ADMIN_EMAIL || userEmail;

		console.log(`Promoting ${userEmail} to super_admin...`);

		// Check if admin already exists
		const existingAdmin = await AdminUser.findOne({
			email: userEmail.toLowerCase(),
		});
		if (existingAdmin) {
			console.log('⚠️ User is already an admin!');
			console.log('Current admin status:', existingAdmin);
			return;
		}

		// Create new admin user
		const newAdmin = new AdminUser({
			email: userEmail.toLowerCase(),
			role: 'super_admin',
			createdBy: bootstrapAdmin.toLowerCase(),
			permissions: [],
			isActive: true,
		});

		await newAdmin.save();
		console.log('✅ Successfully promoted user to admin!');
		console.log(`User ${userEmail} now has super_admin privileges.`);
	} catch (error) {
		console.error('❌ Error promoting user to admin:', error);
	} finally {
		// Close the connection gracefully
		await mongoose.connection.close();
		process.exit(0);
	}
}

// Run the script
promoteExistingUserToAdmin();
