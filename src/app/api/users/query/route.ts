import {NextRequest, NextResponse} from 'next/server';
import {UserService} from '@/services/userService';
import {SavedJobService} from '@/services/savedJobService';
import {UserCompanyPreferenceService} from '@/services/userCompanyPreferenceService';
import {EnhancedLogger} from '@/utils/enhancedLogger';
import dbConnect from '@/middleware/database';

const logger = EnhancedLogger.getLogger('UsersQueryAPI', {
	logToFile: true,
	logToConsole: true,
	logDir: '/tmp/scoutly-logs',
	logFileName: 'users-query-api.log',
});

interface QueryUsersRequest {
	emails?: string[];
	email?: string;
}

export async function POST(request: NextRequest) {
	try {
		await dbConnect();

		const requestBody = (await request.json()) as QueryUsersRequest;
		const {emails, email} = requestBody;

		// Support both single email and multiple emails
		if (email) {
			// Single user query - return complete user data
			const user = await UserService.getUserByEmail(email);
			if (!user) {
				return NextResponse.json({error: 'User not found'}, {status: 404});
			}

			// Get saved jobs
			const savedJobs = await SavedJobService.getSavedJobsByUserId(user.id);

			// Get tracked companies with preferences
			const preferences = await UserCompanyPreferenceService.findByUserId(
				(user._id as any).toString(),
			);

			// Transform tracked companies data
			const trackedCompanies = preferences.map(preference => {
				const company = preference.companyId as any; // Populated company data

				return {
					_id: company._id,
					companyID: company.companyID,
					company: company.company,
					careers_url: company.careers_url,
					logo_url: company.logo_url,
					work_model: company.work_model,
					headquarters: company.headquarters,
					office_locations: company.office_locations,
					fields: company.fields,
					userPreference: {
						rank: preference.rank,
						isTracking: preference.isTracking,
						frequency: getRankingFrequency(preference.rank),
						lastUpdated: preference.updatedAt,
					},
				};
			});

			const enrichedUser = {
				...user.toObject(),
				savedJobs,
				trackedCompanies,
			};

			logger.info(`Retrieved complete user data for email: ${email}`);

			return NextResponse.json({user: enrichedUser});
		}

		// Multiple users query (original functionality)
		if (!emails || !Array.isArray(emails) || emails.length === 0) {
			return NextResponse.json(
				{error: 'Either "email" (string) or "emails" (array) is required'},
				{status: 400},
			);
		}

		// Get users by emails
		const userPromises = emails.map(email => UserService.getUserByEmail(email));
		const users = (await Promise.all(userPromises)).filter(Boolean);

		// For each user, fetch their tracked companies and saved jobs
		const enrichedUsers = await Promise.all(
			users.map(async user => {
				if (!user) return null;

				// Get saved jobs
				const savedJobs = await SavedJobService.getSavedJobsByUserId(user.id);

				// Get tracked companies with preferences
				const preferences = await UserCompanyPreferenceService.findByUserId(
					(user._id as any).toString(),
				);

				// Transform tracked companies data
				const trackedCompanies = preferences.map(preference => {
					const company = preference.companyId as any; // Populated company data

					return {
						_id: company._id,
						companyID: company.companyID,
						company: company.company,
						careers_url: company.careers_url,
						logo_url: company.logo_url,
						work_model: company.work_model,
						headquarters: company.headquarters,
						office_locations: company.office_locations,
						fields: company.fields,
						userPreference: {
							rank: preference.rank,
							isTracking: preference.isTracking,
							frequency: getRankingFrequency(preference.rank),
							lastUpdated: preference.updatedAt,
						},
					};
				});

				// Return enriched user data with tracked companies and saved jobs
				return {
					...user.toObject(),
					savedJobs,
					trackedCompanies,
				};
			}),
		);

		// Filter out null results
		const validEnrichedUsers = enrichedUsers.filter(Boolean);

		logger.info(
			`Retrieved ${
				validEnrichedUsers.length
			} specific users with their data for emails: ${emails.join(', ')}`,
		);

		return NextResponse.json({users: validEnrichedUsers});
	} catch (error: any) {
		logger.error('Error fetching specific users:', error);
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}

// Helper function to convert ranking to frequency description
function getRankingFrequency(ranking: number): string {
	if (ranking >= 90) return 'Daily';
	if (ranking >= 80) return 'Every 2 days';
	if (ranking >= 70) return 'Weekly';
	if (ranking >= 60) return 'Bi-weekly';
	return 'Monthly';
}
