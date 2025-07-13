export const dynamic = 'force-dynamic';

import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants/apiEndpoints';
import {logger} from '@/utils/logger';
import {proxyToBackend} from '@/utils/proxyToBackend';
import {requireAuth} from '@/utils/requireAuth';
import {UserCompanyPreferenceCreateSchema} from '@/schemas/userCompanyPreferenceSchemas';
import {
	UserCompanyPreferenceResponseSchema,
	UserCompanyPreferenceArrayResponseSchema,
} from '@/schemas/userCompanyPreferenceResponseSchemas';

export async function GET(request: NextRequest): Promise<Response> {
	await logger.debug(`GET ${endpoint.user_company_preferences.list} called`, {
		env: {...env},
		deployment: {...deployment},
	});

	if (deployment.isVercel && env.isProd) {
		const apiUrl =
			`${apiBaseUrl.prod}${endpoint.user_company_preferences.list}` +
			(request.url.includes('?')
				? request.url.substring(request.url.indexOf('?'))
				: '');
		return proxyToBackend({
			request,
			backendUrl: apiUrl,
			methodOverride: 'GET',
			logPrefix: '[USER_COMPANY_PREFERENCES][GET][PROXY]',
		});
	}

	// Require auth for getting tracked companies
	const {user, response} = await requireAuth(request);
	if (!user) {
		await logger.warn(
			'[USER_COMPANY_PREFERENCES][GET] Unauthorized access attempt',
			{
				ip:
					request.headers.get('x-forwarded-for') || request.headers.get('host'),
			},
		);
		return response as Response;
	}

	try {
		const url = new URL(request.url);
		const email = url.searchParams.get('email');
		const userId = url.searchParams.get('userId');

		const {UserCompanyPreferenceService} = await import(
			'@/services/userCompanyPreferenceService'
		);
		if (!UserCompanyPreferenceService) {
			await logger.error('UserCompanyPreferenceService not implemented');
			return NextResponse.json(
				{error: 'UserCompanyPreferenceService not implemented'},
				{status: 501},
			);
		}

		let preferences;
		if (userId) {
			preferences = await UserCompanyPreferenceService.getByUserId(userId);
		} else if (email) {
			preferences = await UserCompanyPreferenceService.getByEmail(email);
		} else {
			return NextResponse.json(
				{error: 'Must provide userId or email as query param'},
				{status: 400},
			);
		}

		// Validate the flat shape for Zod
		const parseResult = UserCompanyPreferenceArrayResponseSchema.safeParse(
			preferences.companies,
		);
		if (!parseResult.success) {
			await logger.warn(
				'[USER_COMPANY_PREFERENCES][GET] Invalid response shape',
				{
					issues: parseResult.error.issues,
					user:
						user && typeof user === 'object' && 'email' in user
							? user.email
							: undefined,
				},
			);
			return NextResponse.json(
				{error: 'Invalid response shape', details: parseResult.error.issues},
				{status: 500},
			);
		}
		// Return both flat and joined shapes
		return NextResponse.json({
			companies: preferences.companies,
			joined: preferences.joined,
		});
	} catch (error) {
		await logger.error('Error fetching user-company-preferences', error);
		return NextResponse.json(
			{
				error: 'Error fetching user-company-preferences',
				details: (error as Error).message,
			},
			{status: 500},
		);
	}
}

export async function POST(request: NextRequest): Promise<Response> {
	await logger.debug(`POST ${endpoint.user_company_preferences.list} called`, {
		env: {...env},
		deployment: {...deployment},
	});

	if (deployment.isVercel && env.isProd) {
		const apiUrl = `${apiBaseUrl.prod}${endpoint.user_company_preferences.list}`;
		return proxyToBackend({
			request,
			backendUrl: apiUrl,
			methodOverride: 'POST',
			logPrefix: '[USER_COMPANY_PREFERENCES][POST][PROXY]',
		});
	}

	const {user, response} = await requireAuth(request);
	if (!user) {
		await logger.warn(
			'[USER_COMPANY_PREFERENCES][POST] Unauthorized access attempt',
			{
				ip:
					request.headers.get('x-forwarded-for') || request.headers.get('host'),
			},
		);
		return response as Response;
	}

	try {
		const reqBody = await request.json();
		const parseResult = UserCompanyPreferenceCreateSchema.safeParse(reqBody);
		if (!parseResult.success) {
			await logger.warn(
				'[USER_COMPANY_PREFERENCES][POST] Invalid request body',
				{
					issues: parseResult.error.issues,
					user:
						user && typeof user === 'object' && 'email' in user
							? user.email
							: undefined,
				},
			);
			return NextResponse.json(
				{error: 'Invalid request body', details: parseResult.error.issues},
				{status: 400},
			);
		}
		const {UserCompanyPreferenceService} = await import(
			'@/services/userCompanyPreferenceService'
		);
		try {
			const result = await UserCompanyPreferenceService.create(
				parseResult.data,
			);
			// Serialize created record for Zod
			if (result && result.created) {
				const createdArr = Array.isArray(result.created)
					? result.created
					: [result.created];
				const serialized = createdArr.map((pref: any) => ({
					_id: pref._id?.toString(),
					userId: pref.userId,
					companyId: pref.companyId?.toString(),
					rank: pref.rank,
					isTracking: pref.isTracking,
					frequency: pref.frequency,
					createdAt:
						pref.createdAt instanceof Date
							? pref.createdAt.toISOString()
							: pref.createdAt,
					updatedAt:
						pref.updatedAt instanceof Date
							? pref.updatedAt.toISOString()
							: pref.updatedAt,
				}));
				const parseRes =
					UserCompanyPreferenceArrayResponseSchema.safeParse(serialized);
				if (!parseRes.success) {
					await logger.warn(
						'[USER_COMPANY_PREFERENCES][POST] Invalid response shape',
						{
							issues: parseRes.error.issues,
							user:
								user && typeof user === 'object' && 'email' in user
									? user.email
									: undefined,
						},
					);
					return NextResponse.json(
						{error: 'Invalid response shape', details: parseRes.error.issues},
						{status: 500},
					);
				}
				return NextResponse.json(
					serialized.length === 1 ? serialized[0] : serialized,
					{status: 201},
				);
			}
			return NextResponse.json(result, {status: 201});
		} catch (error: any) {
			// Handle duplicate key error
			if (error?.code === 11000) {
				return NextResponse.json(
					{error: 'Company is already being tracked by this user.'},
					{status: 409},
				);
			}
			await logger.error('Error creating user-company-preferences', error);
			return NextResponse.json(
				{
					error: 'Error creating user-company-preferences',
					details: (error as Error).message,
				},
				{status: 500},
			);
		}
	} catch (error) {
		await logger.error('Error creating user-company-preferences', error);
		return NextResponse.json(
			{
				error: 'Error creating user-company-preferences',
				details: (error as Error).message,
			},
			{status: 500},
		);
	}
}

export async function PATCH(request: NextRequest): Promise<Response> {
	await logger.debug(`PATCH ${endpoint.user_company_preferences.list} called`, {
		env: {...env},
		deployment: {...deployment},
	});

	if (deployment.isVercel && env.isProd) {
		const apiUrl = `${apiBaseUrl.prod}${endpoint.user_company_preferences.list}`;
		return proxyToBackend({
			request,
			backendUrl: apiUrl,
			methodOverride: 'PATCH',
			logPrefix: '[USER_COMPANY_PREFERENCES][PATCH][PROXY]',
		});
	}

	try {
		const reqBody = await request.json();
		const {UserCompanyPreferenceService} = await import(
			'@/services/userCompanyPreferenceService'
		);
		const result = await UserCompanyPreferenceService.update(reqBody);
		return NextResponse.json(result);
	} catch (error) {
		await logger.error('Error patching user-company-preferences', error);
		return NextResponse.json(
			{
				error: 'Error patching user-company-preferences',
				details: (error as Error).message,
			},
			{status: 500},
		);
	}
}

export async function DELETE(request: NextRequest): Promise<Response> {
	await logger.debug(
		`DELETE ${endpoint.user_company_preferences.list} called`,
		{
			env: {...env},
			deployment: {...deployment},
		},
	);

	if (deployment.isVercel && env.isProd) {
		const apiUrl = `${apiBaseUrl.prod}${endpoint.user_company_preferences.list}`;
		return proxyToBackend({
			request,
			backendUrl: apiUrl,
			methodOverride: 'DELETE',
			logPrefix: '[USER_COMPANY_PREFERENCES][DELETE][PROXY]',
		});
	}

	try {
		const reqBody = await request.json();
		const {UserCompanyPreferenceService} = await import(
			'@/services/userCompanyPreferenceService'
		);
		const result = await UserCompanyPreferenceService.delete(reqBody);
		return NextResponse.json(result);
	} catch (error) {
		await logger.error('Error deleting user-company-preferences', error);
		return NextResponse.json(
			{
				error: 'Error deleting user-company-preferences',
				details: (error as Error).message,
			},
			{status: 500},
		);
	}
}
