/**
 * Check User Data for Automation
 *
 * Verifies that the development user has all required data for automation
 */

import {connectDB} from '../config/database';
import {User} from '../models/User';
import {UserCompanyPreference} from '../models/UserCompanyPreference';

async function checkUserData() {
	try {
		await connectDB();

		const userEmail = 'judithv.sanchezc@gmail.com';
		const user = await User.findOne({email: userEmail});

		if (!user) {
			console.log('❌ User not found:', userEmail);
			return;
		}

		console.log('✅ User found:', user.email);
		console.log('📄 Has cvUrl:', !!user.cvUrl);
		console.log('👤 Has candidateInfo:', !!user.candidateInfo);

		// Check tracked companies
		const trackedCompanies = await UserCompanyPreference.find({
			userId: userEmail,
			isTracking: true,
		}).populate('companyId');

		console.log('🏢 Tracked companies:', trackedCompanies.length);

		if (trackedCompanies.length > 0) {
			console.log('📊 Company rankings:');
			for (const pref of trackedCompanies) {
				const company = pref.companyId as any;
				console.log(`   - ${company?.company || 'Unknown'}: rank ${pref.rank}`);
			}
		}

		console.log(
			'\n🎯 Ready for automation:',
			!!(user.cvUrl && user.candidateInfo && trackedCompanies.length > 0),
		);
	} catch (error) {
		console.error('❌ Error checking user data:', error);
	} finally {
		process.exit(0);
	}
}

checkUserData();
