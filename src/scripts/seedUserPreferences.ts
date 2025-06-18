#!/usr/bin/env tsx

/**
 * Seed User Company Preferences Script
 *
 * This script creates sample user company preferences for testing the background
 * jobs system. It assigns random but realistic rankings to companies for the
 * default user.
 *
 * Usage: npx tsx src/scripts/seedUserPreferences.ts
 */

import {connectDB, disconnectDB} from '../config/database';
import {Company} from '../models/Company';
import {UserCompanyPreferenceService} from '../services/userCompanyPreferenceService';
import {SimpleLogger} from '../utils/simpleLogger';

const logger = new SimpleLogger('SeedUserPreferences');

// Default user for testing
const DEFAULT_USER_ID = 'judithv.sanchezc@gmail.com';

// Company ranking patterns for realistic testing
const HIGH_PRIORITY_COMPANIES = [
	'vercel',
	'stripe',
	'shopify',
	'github',
	'atlassian',
	'spotify',
	'uber',
	'airbnb',
	'netflix',
	'meta',
];

const MEDIUM_PRIORITY_COMPANIES = [
	'37signals',
	'ashby',
	'linear',
	'notion',
	'figma',
	'discord',
	'twitch',
	'pinterest',
	'dropbox',
	'slack',
];

async function seedUserPreferences() {
	try {
		logger.info('🌱 Starting user preferences seeding...');
		await connectDB();

		// Get all companies
		const allCompanies = await Company.find();
		logger.info(`📊 Found ${allCompanies.length} companies to process`);

		if (allCompanies.length === 0) {
			logger.warn('⚠️ No companies found. Please run seedCompanies.ts first.');
			return;
		}

		let createdCount = 0;
		let updatedCount = 0;

		for (const company of allCompanies) {
			let rank: number;
			let shouldTrack = true;

			// Assign ranks based on company priorities
			if (HIGH_PRIORITY_COMPANIES.includes(company.companyID)) {
				// High priority: ranks 80-95
				rank = 80 + Math.floor(Math.random() * 16);
			} else if (MEDIUM_PRIORITY_COMPANIES.includes(company.companyID)) {
				// Medium priority: ranks 50-79
				rank = 50 + Math.floor(Math.random() * 30);
			} else {
				// Random priority for others
				rank = 20 + Math.floor(Math.random() * 60); // ranks 20-79

				// Some companies won't be tracked (30% chance)
				if (Math.random() < 0.3) {
					shouldTrack = false;
					rank = 25; // Low default rank for untracked
				}
			}

			try {
				// Check if preference already exists
				const existingPreferences =
					await UserCompanyPreferenceService.getAllCompaniesWithPreferences(
						DEFAULT_USER_ID,
					);
				const existingPreference = existingPreferences.find(
					comp =>
						comp._id.toString() === company._id.toString() &&
						comp.userPreference,
				);

				if (existingPreference) {
					// Update existing preference
					await UserCompanyPreferenceService.updateCompanyRank(
						DEFAULT_USER_ID,
						company._id.toString(),
						rank,
					);
					updatedCount++;
				} else {
					// Create new preference
					await UserCompanyPreferenceService.setCompanyPreference(
						DEFAULT_USER_ID,
						company._id.toString(),
						rank,
						shouldTrack,
					);
					createdCount++;
				}

				if (shouldTrack) {
					logger.debug(
						`✅ ${company.company}: rank ${rank} (tracking: ${shouldTrack})`,
					);
				}
			} catch (error: any) {
				logger.error(`❌ Failed to process ${company.company}:`, error.message);
			}
		}

		// Log summary statistics
		const stats = await UserCompanyPreferenceService.getTrackingStats(
			DEFAULT_USER_ID,
		);

		logger.success(`🎉 Seeding completed!`);
		logger.info(`📈 Summary:`);
		logger.info(`   • Created: ${createdCount} preferences`);
		logger.info(`   • Updated: ${updatedCount} preferences`);
		logger.info(`   • Total tracked: ${stats.totalTracked} companies`);
		logger.info(`   • Average rank: ${stats.averageRank}`);
		logger.info(`   • Frequency distribution:`);

		Object.entries(stats.byFrequency).forEach(([frequency, count]) => {
			logger.info(`     - ${frequency}: ${count} companies`);
		});
	} catch (error: any) {
		logger.error('💥 Seeding failed:', error);
		throw error;
	} finally {
		await disconnectDB();
	}
}

// Helper function to clear all preferences for testing
async function clearUserPreferences() {
	try {
		logger.info('🧹 Clearing all user preferences...');
		await connectDB();

		const {UserCompanyPreference} = await import(
			'../models/UserCompanyPreference'
		);
		const result = await UserCompanyPreference.deleteMany({
			userId: DEFAULT_USER_ID,
		});

		logger.success(`✅ Deleted ${result.deletedCount} preferences`);
	} catch (error: any) {
		logger.error('💥 Failed to clear preferences:', error);
		throw error;
	} finally {
		await disconnectDB();
	}
}

// Main execution
if (require.main === module) {
	const shouldClear = process.argv.includes('--clear');

	if (shouldClear) {
		clearUserPreferences()
			.then(() => {
				logger.info('🏁 Clear completed successfully');
				process.exit(0);
			})
			.catch(error => {
				logger.error('💥 Clear failed:', error);
				process.exit(1);
			});
	} else {
		seedUserPreferences()
			.then(() => {
				logger.info('🏁 Seeding completed successfully');
				process.exit(0);
			})
			.catch(error => {
				logger.error('💥 Seeding failed:', error);
				process.exit(1);
			});
	}
}

export {seedUserPreferences, clearUserPreferences};
