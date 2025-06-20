import {NextRequest, NextResponse} from 'next/server';
import {UserService} from '@/services/userService';
import {UserCompanyPreferenceService} from '@/services/userCompanyPreferenceService';
import {SavedJobService} from '@/services/savedJobService';
import {EnhancedLogger} from '@/utils/enhancedLogger';
import dbConnect from '@/middleware/database';

const logger = EnhancedLogger.getLogger('UsersQueryAPI', {
	logToFile: true,
	logToConsole: true,
	logDir: '/tmp/scoutly-logs',
	logFileName: 'users-query-api.log',
});

interface QueryUsersRequest {
	emails: string[];
}

export async function POST(request: NextRequest) {
	try {
		await dbConnect();

		const {emails} = (await request.json()) as QueryUsersRequest;

		if (!emails || !Array.isArray(emails) || emails.length === 0) {
			return NextResponse.json(
				{error: 'emails array is required and cannot be empty'},
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

				// Get only actually tracked companies (not all companies)
				const trackedCompanies =
					await UserCompanyPreferenceService.getTrackedCompanies(user.id);

				// Get saved jobs
				const savedJobs = await SavedJobService.getSavedJobsByUserId(user.id);

				// Return enriched user data
				return {
					...user.toObject(),
					trackedCompanies,
					savedJobs,
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
