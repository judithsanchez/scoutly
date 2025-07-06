import {NextRequest, NextResponse} from 'next/server';
import {UserService} from '@/services/userService';
import {SavedJobService} from '@/services/savedJobService';
import {EnhancedLogger} from '@/utils/enhancedLogger';
import dbConnect from '@/middleware/database';
import {
	CreateUserRequestSchema,
	CreateUserResponseSchema,
	GetUsersResponseSchema,
	ErrorResponseSchema,
	type CreateUserRequest,
} from '@/schemas/userSchemas';

const logger = EnhancedLogger.getLogger('UsersAPI', {
	logToFile: true,
	logToConsole: true,
	logDir: '/tmp/scoutly-logs',
	logFileName: 'users-api.log',
});

export async function POST(request: NextRequest) {
	try {
		await dbConnect();

		// Parse and validate request body using Zod
		const body = await request.json();
		const validationResult = CreateUserRequestSchema.safeParse(body);

		if (!validationResult.success) {
			logger.warn('Invalid request body:', validationResult.error.errors);
			return NextResponse.json(
				ErrorResponseSchema.parse({
					error: 'Invalid request body',
					details: validationResult.error.errors,
				}),
				{status: 400},
			);
		}

		const {email, cvUrl, candidateInfo} = validationResult.data;

		const user = await UserService.getOrCreateUser(
			email,
			cvUrl,
			candidateInfo as any,
		);

		logger.info(`User registered or updated successfully: ${email}`);

		// Create response object with proper type conversion
		const userResponse = {
			_id: (user._id as any).toString(),
			email: user.email,
			cvUrl: user.cvUrl,
			candidateInfo: user.candidateInfo as any, // Convert Mongoose schema to plain object
			createdAt: user.createdAt.toISOString(),
			updatedAt: user.updatedAt.toISOString(),
		};

		// Validate response using Zod schema
		const response = CreateUserResponseSchema.parse({
			success: true,
			user: userResponse,
			message: 'User registered successfully',
		});

		return NextResponse.json(response);
	} catch (error: any) {
		logger.error('Error registering user:', error);
		return NextResponse.json(
			ErrorResponseSchema.parse({
				error: error.message || 'Internal server error',
			}),
			{status: 500},
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		await dbConnect();

		// Get all users
		const users = await UserService.getAllUsers();

		// For each user, fetch their saved jobs
		const enrichedUsers = await Promise.all(
			users.map(async user => {
				// Get saved jobs
				const savedJobs = await SavedJobService.getSavedJobsByUserId(user.id);

				// Return enriched user data (no tracked companies since background jobs removed)
				return {
					...user.toObject(),
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
