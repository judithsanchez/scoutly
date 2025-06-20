import {NextRequest, NextResponse} from 'next/server';
import {UserService} from '@/services/userService';
import {UserCompanyPreferenceService} from '@/services/userCompanyPreferenceService';
import {SavedJobService} from '@/services/savedJobService';
import {EnhancedLogger} from '@/utils/enhancedLogger';
import dbConnect from '@/middleware/database';

const logger = EnhancedLogger.getLogger('UsersAPI', {
	logToFile: true,
	logToConsole: true,
	logDir: '/tmp/scoutly-logs',
	logFileName: 'users-api.log',
});

import {IUser} from '@/models/User'; // Import IUser interface

interface RegisterUserRequest {
	email: string;
	cvUrl?: string;
	candidateInfo?: IUser['candidateInfo']; // Use the type from IUser
}

export async function POST(request: NextRequest) {
	try {
		await dbConnect();

		const {email, cvUrl, candidateInfo} =
			(await request.json()) as RegisterUserRequest;

		if (!email) {
			return NextResponse.json({error: 'Email is required'}, {status: 400});
		}

		const user = await UserService.getOrCreateUser(email, cvUrl, candidateInfo);

		logger.info(`User registered or updated successfully: ${email}`);

		return NextResponse.json({
			success: true,
			user,
			message: 'User registered successfully',
		});
	} catch (error: any) {
		logger.error('Error registering user:', error);
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		await dbConnect();

		// Get all users
		const users = await UserService.getAllUsers();

		// For each user, fetch their tracked companies and saved jobs
		const enrichedUsers = await Promise.all(
			users.map(async user => {
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

		logger.info(`Retrieved ${enrichedUsers.length} users with their data`);

		return NextResponse.json({users: enrichedUsers});
	} catch (error: any) {
		logger.error('Error fetching users:', error);
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}
