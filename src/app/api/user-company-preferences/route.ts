export const dynamic = 'force-dynamic';

import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants/apiEndpoints';
import {logger} from '@/utils/logger';
import {proxyToBackend} from '@/utils/proxyToBackend';

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

		// Service should return tracked companies already joined with company info
		return NextResponse.json({companies: preferences});
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

	try {
		const reqBody = await request.json();
		const {UserCompanyPreferenceService} = await import(
			'@/services/userCompanyPreferenceService'
		);
		const result = await UserCompanyPreferenceService.create(reqBody);
		return NextResponse.json(result, {status: 201});
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
