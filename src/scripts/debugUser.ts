#!/usr/bin/env ts-node

/**
 * User Debug Utility
 *
 * This script helps debug user-related issues by providing detailed information
 * about user records, profile completeness, and database state.
 */

import dbConnect from '../middleware/database';
import {User} from '../models/User';
import {UserCompanyPreferenceService} from '../services/userCompanyPreferenceService';
import {Logger} from '../utils/logger';

const logger = new Logger('UserDebugUtility');

interface UserDebugInfo {
	exists: boolean;
	userRecord?: any;
	profileCompleteness: {
		hasEmail: boolean;
		hasCvUrl: boolean;
		hasCandidateInfo: boolean;
		hasTrackedCompanies: boolean;
		trackedCompaniesCount: number;
	};
	issues: string[];
	recommendations: string[];
}

async function debugUser(email: string): Promise<UserDebugInfo> {
	const result: UserDebugInfo = {
		exists: false,
		profileCompleteness: {
			hasEmail: false,
			hasCvUrl: false,
			hasCandidateInfo: false,
			hasTrackedCompanies: false,
			trackedCompaniesCount: 0,
		},
		issues: [],
		recommendations: [],
	};

	try {
		await dbConnect();
		logger.info(`Looking up user: ${email}`);

		const user = await User.findOne({email});

		if (!user) {
			result.exists = false;
			result.issues.push('User record does not exist in database');
			result.recommendations.push('Check if user was accidentally deleted');
			result.recommendations.push(
				'User will be auto-created on next profile API call in development mode',
			);
			return result;
		}

		result.exists = true;
		result.userRecord = user.toObject();

		// Get user company preferences using the new service
		const userPreferences = await UserCompanyPreferenceService.findByUserId(
			user._id.toString(),
		);

		// Check profile completeness
		result.profileCompleteness.hasEmail = !!user.email;
		result.profileCompleteness.hasCvUrl = !!user.cvUrl;
		result.profileCompleteness.hasCandidateInfo = !!user.candidateInfo;
		result.profileCompleteness.hasTrackedCompanies =
			!!userPreferences && userPreferences.length > 0;
		result.profileCompleteness.trackedCompaniesCount =
			userPreferences?.length || 0;

		// Identify issues
		if (!result.profileCompleteness.hasEmail) {
			result.issues.push('Missing email address');
		}
		if (!result.profileCompleteness.hasCvUrl) {
			result.issues.push('Missing CV/Resume URL - required for job search');
			result.recommendations.push(
				'User needs to upload CV/Resume in profile page',
			);
		}
		if (!result.profileCompleteness.hasCandidateInfo) {
			result.issues.push(
				'Missing candidate information - required for job search',
			);
			result.recommendations.push(
				'User needs to complete profile information (preferences, logistics, etc.)',
			);
		}
		if (!result.profileCompleteness.hasTrackedCompanies) {
			result.issues.push(
				'No tracked companies - job search will have no targets',
			);
			result.recommendations.push(
				'User needs to select companies to track in their profile',
			);
		}

		// Success indicators
		if (result.issues.length === 0) {
			result.recommendations.push(
				'Profile is complete and ready for job search',
			);
		}

		logger.info('User debug analysis completed', {
			email,
			issuesCount: result.issues.length,
			exists: result.exists,
		});

		return result;
	} catch (error: any) {
		logger.error('Error debugging user', error);
		result.issues.push(`Database error: ${error.message}`);
		result.recommendations.push('Check database connection and User model');
		return result;
	}
}

async function printUserDebugInfo(email: string) {
	console.log(`\n🔍 Debugging User: ${email}`);
	console.log('='.repeat(50));

	const debugInfo = await debugUser(email);

	console.log(`\n📊 User Status:`);
	console.log(`   Exists in DB: ${debugInfo.exists ? '✅ YES' : '❌ NO'}`);

	if (debugInfo.exists && debugInfo.userRecord) {
		console.log(`\n📋 Profile Completeness:`);
		console.log(
			`   Email: ${debugInfo.profileCompleteness.hasEmail ? '✅' : '❌'} ${
				debugInfo.userRecord.email || 'MISSING'
			}`,
		);
		console.log(
			`   CV/Resume URL: ${
				debugInfo.profileCompleteness.hasCvUrl ? '✅' : '❌'
			} ${debugInfo.userRecord.cvUrl || 'MISSING'}`,
		);
		console.log(
			`   Candidate Info: ${
				debugInfo.profileCompleteness.hasCandidateInfo ? '✅' : '❌'
			} ${
				debugInfo.profileCompleteness.hasCandidateInfo ? 'PRESENT' : 'MISSING'
			}`,
		);
		console.log(
			`   Tracked Companies: ${
				debugInfo.profileCompleteness.hasTrackedCompanies ? '✅' : '❌'
			} ${debugInfo.profileCompleteness.trackedCompaniesCount} companies`,
		);

		console.log(`\n📄 Raw User Record:`);
		console.log(JSON.stringify(debugInfo.userRecord, null, 2));
	}

	if (debugInfo.issues.length > 0) {
		console.log(`\n⚠️  Issues Found (${debugInfo.issues.length}):`);
		debugInfo.issues.forEach((issue, index) => {
			console.log(`   ${index + 1}. ${issue}`);
		});
	}

	if (debugInfo.recommendations.length > 0) {
		console.log(`\n💡 Recommendations (${debugInfo.recommendations.length}):`);
		debugInfo.recommendations.forEach((rec, index) => {
			console.log(`   ${index + 1}. ${rec}`);
		});
	}

	console.log('\n' + '='.repeat(50));
}

// CLI interface
async function main() {
	const email = process.argv[2] || 'judithv.sanchezc@gmail.com';

	try {
		await printUserDebugInfo(email);
	} catch (error) {
		console.error('❌ Script failed:', error);
		process.exit(1);
	} finally {
		process.exit(0);
	}
}

// Export for use as module
export {debugUser, printUserDebugInfo};

// Run if called directly
if (require.main === module) {
	main();
}
