import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants';
import {logger} from '@/utils/logger';

let UserService: any;
try {
	UserService = require('@/services/userService').UserService;
} catch {}

export async function POST(request: NextRequest) {
	await logger.debug(`POST ${endpoint.users.main} called`, {
		env: {...env},
		deployment: {...deployment},
	});

	const reqBody = await request.json();

	if (env.isDev || (env.isProd && deployment.isPi)) {
		if (!UserService) {
			await logger.error('UserService not implemented');
			return NextResponse.json(
				{error: 'UserService not implemented'},
				{status: 501},
			);
		}
		try {
			const user = await UserService.createUser(reqBody);
			return NextResponse.json(user);
		} catch (error) {
			await logger.error('Error creating user', error);
			return NextResponse.json(
				{
					error: 'Error creating user',
					details: (error as Error).message,
				},
				{status: 500},
			);
		}
	}

	if (env.isProd && deployment.isVercel) {
		await logger.info(
			'Environment: Production on Vercel - proxying to backend API',
		);
		const apiUrl = apiBaseUrl.prod;
		if (!apiUrl) {
			await logger.error('Backend API URL not configured');
			return NextResponse.json(
				{error: 'Backend API URL not configured'},
				{status: 500},
			);
		}
		try {
			await logger.debug('Proxying create user to backend API', {
				url: `${apiUrl}${endpoint.users.main}`,
			});
			const response = await fetch(`${apiUrl}${endpoint.users.main}`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify(reqBody),
			});
			const data = await response.json();
			if (!response.ok) {
				await logger.error('Failed to create user via backend API', {
					status: response.status,
				});
				return NextResponse.json(
					{error: data.error || 'Failed to create user via backend API'},
					{status: response.status},
				);
			}
			await logger.info('User created via backend API');
			return NextResponse.json(data);
		} catch (error) {
			await logger.error('Error connecting to backend API', error);
			return NextResponse.json(
				{
					error: 'Error connecting to backend API',
					details: (error as Error).message,
				},
				{status: 500},
			);
		}
	}
}

export async function GET() {
	await logger.debug(`GET ${endpoint.users.main} called`, {
		env: {...env},
		deployment: {...deployment},
	});

	if (env.isDev || (env.isProd && deployment.isPi)) {
		if (!UserService) {
			await logger.error('UserService not implemented');
			return NextResponse.json(
				{error: 'UserService not implemented'},
				{status: 501},
			);
		}
		try {
			const users = await UserService.getAllUsers();
			return NextResponse.json(users);
		} catch (error) {
			await logger.error('Error fetching users', error);
			return NextResponse.json(
				{
					error: 'Error fetching users',
					details: (error as Error).message,
				},
				{status: 500},
			);
		}
	}

	if (env.isProd && deployment.isVercel) {
		await logger.info(
			'Environment: Production on Vercel - proxying to backend API',
		);
		const apiUrl = apiBaseUrl.prod;
		if (!apiUrl) {
			await logger.error('Backend API URL not configured');
			return NextResponse.json(
				{error: 'Backend API URL not configured'},
				{status: 500},
			);
		}
		try {
			await logger.debug('Proxying get users to backend API', {
				url: `${apiUrl}${endpoint.users.main}`,
			});
			const response = await fetch(`${apiUrl}${endpoint.users.main}`, {
				method: 'GET',
				headers: {'Content-Type': 'application/json'},
			});
			const data = await response.json();
			if (!response.ok) {
				await logger.error('Failed to fetch users via backend API', {
					status: response.status,
				});
				return NextResponse.json(
					{error: data.error || 'Failed to fetch users via backend API'},
					{status: response.status},
				);
			}
			await logger.info('Users fetched via backend API');
			return NextResponse.json(data);
		} catch (error) {
			await logger.error('Error connecting to backend API', error);
			return NextResponse.json(
				{
					error: 'Error connecting to backend API',
					details: (error as Error).message,
				},
				{status: 500},
			);
		}
	}
}
