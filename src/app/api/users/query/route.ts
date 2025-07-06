import {NextRequest, NextResponse} from 'next/server';
import {UserService} from '@/services/userService';
import {SavedJobService} from '@/services/savedJobService';
import {UserCompanyPreferenceService} from '@/services/userCompanyPreferenceService';
import {EnhancedLogger} from '@/utils/enhancedLogger';
import dbConnect from '@/middleware/database';
import {
	QueryUsersRequestSchema,
	QueryUsersSingleResponseSchema,
	QueryUsersMultipleResponseSchema,
	QueryUsersRequest,
} from '@/schemas/userQuerySchemas';
import {ErrorResponseSchema} from '@/schemas/userSchemas';
import {calculateFrequency} from '@/utils/frequency';

const logger = EnhancedLogger.getLogger('UsersQueryAPI', {
	logToFile: true,
	logToConsole: true,
	logDir: '/tmp/scoutly-logs',
	logFileName: 'users-query-api.log',
});

export async function POST(request: NextRequest) {
	try {
		await dbConnect();

		const body = await request.json();
		const parseResult = QueryUsersRequestSchema.safeParse(body);

		if (!parseResult.success) {
			logger.warn('Invalid request body:', parseResult.error.errors);
			return NextResponse.json(
				ErrorResponseSchema.parse({
					error: 'Invalid request body',
					details: parseResult.error.errors,
				}),
				{status: 400},
			);
		}

		const {emails, email} = parseResult.data;

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

			console.log(
				'DEBUG: preferences raw:',
				JSON.stringify(preferences, null, 2),
			);
			// Transform tracked companies data
			const trackedCompanies = preferences.map(preference => {
				const company = preference.companyId as any; // Populated company data

				return {
					_id: company._id?.toString?.() ?? company._id,
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
						frequency: calculateFrequency(preference.rank),
						lastUpdated: preference.updatedAt
							? new Date(preference.updatedAt as any).toISOString()
							: undefined,
					},
				};
			});

			const userObj =
				typeof user.toObject === 'function' ? user.toObject() : user;
			const enrichedUser = {
				...userObj,
				_id: userObj._id?.toString?.() ?? userObj._id,
				createdAt: userObj.createdAt
					? new Date(userObj.createdAt as any).toISOString()
					: undefined,
				updatedAt: userObj.updatedAt
					? new Date(userObj.updatedAt as any).toISOString()
					: undefined,
				savedJobs,
				trackedCompanies,
			};

			logger.info(`Retrieved complete user data for email: ${email}`);

			// Validate response with Zod
			const response = QueryUsersSingleResponseSchema.parse({
				user: enrichedUser,
			});

			return NextResponse.json(response);
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
							frequency: calculateFrequency(preference.rank),
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

		const response = QueryUsersMultipleResponseSchema.parse({
			users: validEnrichedUsers,
		});

		return NextResponse.json(response);
	} catch (error: any) {
		logger.error('Error fetching specific users:', error);
		return NextResponse.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}
