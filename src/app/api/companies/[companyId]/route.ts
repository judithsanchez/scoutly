export const dynamic = 'force-dynamic';

import {NextRequest, NextResponse} from 'next/server';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants/apiEndpoints';
import {CompanyService} from '@/services/companyService';
import {logger} from '@/utils/logger';
import {z} from 'zod';
import {requireAuth} from '@/utils/requireAuth';
import {proxyToBackend} from '@/utils/proxyToBackend';
import {CompanySchema} from '@/schemas/companySchemas';
import {WorkModel, ICompany} from '@/types/company';
import {getUserEmail, toWorkModel} from '@/utils/typeHelpers';

const updateCompanySchema = z.object({
	company: z.string().optional(),
	careers_url: z.string().url().optional(),
	selector: z.string().optional(),
	work_model: z.enum(['FULLY_REMOTE', 'HYBRID', 'IN_OFFICE']).optional(),
	headquarters: z.string().optional(),
	office_locations: z.array(z.string()).optional(),
	fields: z.array(z.string()).optional(),
	openToApplication: z.boolean().optional(),
});

export async function PATCH(
	request: NextRequest,
	{params}: {params: {companyId: string}},
) {
	if (deployment.isVercel && env.isProd) {
		const apiUrlFull = `${apiBaseUrl.prod}${endpoint.companies.list}/${params.companyId}`;
		return proxyToBackend({
			request,
			backendUrl: apiUrlFull,
			methodOverride: 'PATCH',
			logPrefix: '[COMPANIES][PATCH][PROXY]',
		});
	}

	await logger.debug(
		`[COMPANIES][PATCH] ${endpoint.companies.list}/${params.companyId} called`,
		{
			env: {...env},
			deployment: {...deployment},
			companyId: params.companyId,
			headers: Object.fromEntries(request.headers.entries()),
		},
	);

	const {user, response} = await requireAuth(request);
	const userEmail = getUserEmail(user);
	if (!user) {
		await logger.warn('[COMPANIES][PATCH] Unauthorized access attempt', {
			ip: request.headers.get('x-forwarded-for') || request.headers.get('host'),
			companyId: params.companyId,
		});
		return response;
	}

	if (!deployment.isVercel) {
		try {
			const reqBody = await request.json();
			const parseResult = updateCompanySchema.safeParse(reqBody);

			if (!parseResult.success) {
				await logger.warn('[COMPANIES][PATCH] Invalid update company payload', {
					issues: parseResult.error.issues,
					user: userEmail,
					companyId: params.companyId,
				});
				return NextResponse.json(
					{
						error: 'Invalid update company payload',
						details: parseResult.error.issues,
					},
					{status: 400},
				);
			}

			const transformedData = {
				...parseResult.data,
				work_model: toWorkModel(parseResult.data.work_model),
			};

			const companyParse = CompanySchema.partial().safeParse(transformedData);
			if (!companyParse.success) {
				await logger.warn(
					'[COMPANIES][PATCH] Invalid company shape after transform',
					{
						issues: companyParse.error.issues,
						user: userEmail,
						companyId: params.companyId,
					},
				);
				return NextResponse.json(
					{
						error: 'Invalid company shape after transform',
						details: companyParse.error.issues,
					},
					{status: 400},
				);
			}

			const updated = await CompanyService.updateCompany(
				params.companyId,
				companyParse.data as Partial<ICompany>,
			);
			await logger.info('[COMPANIES][PATCH] Company updated successfully', {
				companyId: params.companyId,
				user: userEmail,
			});
			return NextResponse.json(updated);
		} catch (error) {
			await logger.error('[COMPANIES][PATCH] Error updating company', {
				error,
				user: userEmail,
				companyId: params.companyId,
			});
			return NextResponse.json(
				{
					error: 'Error updating company',
					details: (error as Error).message,
				},
				{status: 500},
			);
		}
	}
}

export async function DELETE(
	request: NextRequest,
	{params}: {params: {companyId: string}},
) {
	if (deployment.isVercel && env.isProd) {
		const apiUrlFull = `${apiBaseUrl.prod}${endpoint.companies.list}/${params.companyId}`;
		return proxyToBackend({
			request,
			backendUrl: apiUrlFull,
			methodOverride: 'DELETE',
			logPrefix: '[COMPANIES][DELETE][PROXY]',
		});
	}

	await logger.debug(
		`[COMPANIES][DELETE] ${endpoint.companies.list}/${params.companyId} called`,
		{
			env: {...env},
			deployment: {...deployment},
			companyId: params.companyId,
			headers: Object.fromEntries(request.headers.entries()),
		},
	);

	const {user, response} = await requireAuth(request);
	const userEmail = getUserEmail(user);
	if (!user) {
		await logger.warn('[COMPANIES][DELETE] Unauthorized access attempt', {
			ip: request.headers.get('x-forwarded-for') || request.headers.get('host'),
			companyId: params.companyId,
		});
		return response;
	}

	if (!deployment.isVercel) {
		try {
			const deleted = await CompanyService.deleteCompany(params.companyId);
			await logger.info('[COMPANIES][DELETE] Company deleted successfully', {
				companyId: params.companyId,
				user: userEmail,
			});
			return NextResponse.json(deleted);
		} catch (error) {
			await logger.error('[COMPANIES][DELETE] Error deleting company', {
				error,
				user: userEmail,
				companyId: params.companyId,
			});
			return NextResponse.json(
				{
					error: 'Error deleting company',
					details: (error as Error).message,
				},
				{status: 500},
			);
		}
	}
}
