import {UserService} from '@/services/userService';
import {Logger} from '@/utils/logger';
import dbConnect from '@/middleware/database';

const logger = new Logger('UsersAPI');

interface RegisterUserRequest {
	email: string;
}

export async function POST(request: Request) {
	try {
		await dbConnect();

		const {email} = (await request.json()) as RegisterUserRequest;

		if (!email) {
			return Response.json({error: 'Email is required'}, {status: 400});
		}

		const user = await UserService.getOrCreateUser(email);
		return Response.json({
			success: true,
			user,
			message: 'User registered successfully',
		});
	} catch (error: any) {
		logger.error('Error registering user:', error);
		return Response.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}

export async function GET(request: Request) {
	try {
		await dbConnect();

		const users = await UserService.getAllUsers();
		return Response.json({users});
	} catch (error: any) {
		logger.error('Error fetching users:', error);
		return Response.json(
			{error: error.message || 'Internal server error'},
			{status: 500},
		);
	}
}
