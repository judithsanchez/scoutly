import {connectToDatabase} from '../lib/mongodb.js';
import {User} from '../models/User.js';
import {AdminUser} from '../models/AdminUser.js';

/**
 * Quick setup script to add a user and make them admin
 * Usage: npx tsx src/scripts/setupUser.ts your_email@gmail.com
 */

async function setupUser() {
	const email = process.argv[2];

	if (!email) {
		console.error('❌ Please provide an email address');
		console.log('Usage: npx tsx src/scripts/setupUser.ts your_email@gmail.com');
		process.exit(1);
	}

	if (!email.includes('@')) {
		console.error('❌ Please provide a valid email address');
		process.exit(1);
	}

	try {
		await connectToDatabase();
		console.log('✅ Connected to database');

		// Check if user already exists
		const existingUser = await User.findOne({email: email.toLowerCase()});

		if (existingUser) {
			console.log(`ℹ️  User ${email} already exists`);
		} else {
			// Create the user
			const user = new User({
				email: email.toLowerCase(),
			});
			await user.save();
			console.log(`✅ Created user: ${email}`);
		}

		// Check if admin already exists
		const existingAdmin = await AdminUser.findOne({email: email.toLowerCase()});

		if (existingAdmin) {
			console.log(`ℹ️  User ${email} is already an admin`);
		} else {
			// Make them admin
			const adminUser = new AdminUser({
				email: email.toLowerCase(),
				promotedBy: 'setup-script',
				promotedAt: new Date(),
			});
			await adminUser.save();
			console.log(`✅ Granted admin privileges to: ${email}`);
		}

		console.log('\n🎉 Setup complete! You can now:');
		console.log('1. Start the app: docker-compose up -d');
		console.log('2. Visit: http://localhost:3000/auth/signin');
		console.log('3. Sign in with Google using this email');
		console.log('4. Access admin panel at: http://localhost:3000/admin');
	} catch (error) {
		console.error('❌ Error setting up user:', error);
		process.exit(1);
	} finally {
		process.exit(0);
	}
}

setupUser();
