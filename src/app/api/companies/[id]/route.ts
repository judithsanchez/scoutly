import {corsOptionsResponse} from '@/utils/cors';

export async function OPTIONS() {
	return corsOptionsResponse('companies/[id]');
}
import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants/apiEndpoints';
import {CompanyService} from '@/services/companyService';
import {logger} from '@/utils/logger';
import {requireAuth} from '@/utils/requireAuth';
import {proxyToBackend} from '@/utils/proxyToBackend';
import {CompanyZodSchema} from '@/schemas/companySchemas';

export async function GET(
	request: NextRequest,
	{params}: {params: {id: string}},
): Promise<Response> {
	if (deployment.isVercel && env.isProd) {
		const apiUrlFull = `${apiBaseUrl.prod}${endpoint.companies.byId.replace(
			':id',
			params.id,
		)}`;
		return proxyToBackend({
			request,
			backendUrl: apiUrlFull,
			methodOverride: 'GET',
			logPrefix: '[COMPANIES][GET][BY_ID][PROXY]',
		});
	}

	const {user, response} = await requireAuth(request);
	if (!user) {
		await logger.warn('[COMPANIES][GET][BY_ID] Unauthorized access attempt', {
			ip: request.headers.get('x-forwarded-for') || request.headers.get('host'),
		});
		return response as Response;
	}

	try {
		const company = await CompanyService.getCompanyById(params.id);
		if (!company) {
			return NextResponse.json({error: 'Company not found'}, {status: 404});
		}
		const obj = company.toObject ? company.toObject() : company;
		const {_id, ...companyData} = obj;
		const companyWithId = {
			...companyData,
			id: _id?.toString(),
		};
		for (const key in companyWithId) {
			if (companyWithId[key] instanceof Date) {
				companyWithId[key] = companyWithId[key].toISOString();
			}
		}
		const parseResult = CompanyZodSchema.safeParse(companyWithId);
		if (!parseResult.success) {
			await logger.warn('[COMPANIES][GET][BY_ID] Invalid company shape', {
				issues: parseResult.error.issues,
				user:
					typeof user === 'object' && user !== null && 'email' in user
						? user.email
						: undefined,
			});
			return NextResponse.json(
				{error: 'Invalid company shape', details: parseResult.error.issues},
				{status: 500},
			);
		}
		return NextResponse.json(parseResult.data);
	} catch (error) {
		await logger.error('[COMPANIES][GET][BY_ID] Error fetching company', {
			error,
			user:
				typeof user === 'object' && user !== null && 'email' in user
					? user.email
					: undefined,
		});
		return NextResponse.json(
			{error: 'Error fetching company', details: (error as Error).message},
			{status: 500},
		);
	}
}

export async function PATCH(
	request: NextRequest,
	{params}: {params: {id: string}},
): Promise<Response> {
	if (deployment.isVercel && env.isProd) {
		const apiUrlFull = `${apiBaseUrl.prod}${endpoint.companies.byId.replace(
			':id',
			params.id,
		)}`;
		return proxyToBackend({
			request,
			backendUrl: apiUrlFull,
			methodOverride: 'PATCH',
			logPrefix: '[COMPANIES][PATCH][BY_ID][PROXY]',
		});
	}

	const {user, response} = await requireAuth(request);
	if (!user) {
		await logger.warn('[COMPANIES][PATCH][BY_ID] Unauthorized access attempt', {
			ip: request.headers.get('x-forwarded-for') || request.headers.get('host'),
		});
		return response as Response;
	}

	try {
		const body = await request.json();
		const company = await CompanyService.updateCompany(params.id, body);
		if (!company) {
			return NextResponse.json({error: 'Company not found'}, {status: 404});
		}
		const obj = company.toObject ? company.toObject() : company;
		const {_id, ...companyData} = obj;
		const companyWithId = {
			...companyData,
			id: _id?.toString(),
		};
		for (const key in companyWithId) {
			if (companyWithId[key] instanceof Date) {
				companyWithId[key] = companyWithId[key].toISOString();
			}
		}
		const parseResult = CompanyZodSchema.safeParse(companyWithId);
		if (!parseResult.success) {
			await logger.warn('[COMPANIES][PATCH][BY_ID] Invalid company shape', {
				issues: parseResult.error.issues,
				user:
					typeof user === 'object' && user !== null && 'email' in user
						? user.email
						: undefined,
			});
			return NextResponse.json(
				{error: 'Invalid company shape', details: parseResult.error.issues},
				{status: 500},
			);
		}
		return NextResponse.json(parseResult.data);
	} catch (error) {
		await logger.error('[COMPANIES][PATCH][BY_ID] Error updating company', {
			error,
			user:
				typeof user === 'object' && user !== null && 'email' in user
					? user.email
					: undefined,
		});
		return NextResponse.json(
			{error: 'Error updating company', details: (error as Error).message},
			{status: 500},
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{params}: {params: {id: string}},
): Promise<Response> {
	if (deployment.isVercel && env.isProd) {
		const apiUrlFull = `${apiBaseUrl.prod}${endpoint.companies.byId.replace(
			':id',
			params.id,
		)}`;
		return proxyToBackend({
			request,
			backendUrl: apiUrlFull,
			methodOverride: 'DELETE',
			logPrefix: '[COMPANIES][DELETE][BY_ID][PROXY]',
		});
	}

	const {user, response} = await requireAuth(request);
	if (!user) {
		await logger.warn(
			'[COMPANIES][DELETE][BY_ID] Unauthorized access attempt',
			{
				ip:
					request.headers.get('x-forwarded-for') || request.headers.get('host'),
			},
		);
		return response as Response;
	}

	try {
		const company = await CompanyService.deleteCompany(params.id);
		if (!company) {
			return NextResponse.json({error: 'Company not found'}, {status: 404});
		}
		return NextResponse.json({success: true, id: company._id?.toString()});
	} catch (error) {
		await logger.error('[COMPANIES][DELETE][BY_ID] Error deleting company', {
			error,
			user:
				typeof user === 'object' && user !== null && 'email' in user
					? user.email
					: undefined,
		});
		return NextResponse.json(
			{error: 'Error deleting company', details: (error as Error).message},
			{status: 500},
		);
	}
}
