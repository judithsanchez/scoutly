export const dynamic = 'force-dynamic';

import {NextRequest, NextResponse} from 'next/server';
import {env, deployment} from '@/config/environment';
import {endpoint} from '@/constants';
import {logger} from '@/utils/logger';
import {z} from 'zod';
import {requireAuth} from '@/utils/requireAuth';

const updateRankingsSchema = z.object({
	rankings: z.array(
		z.object({
			companyID: z.string(),
			rank: z.number().int().min(0).max(100),
		}),
	),
});

export async function POST(request: NextRequest) {
	if (deployment.isVercel) {
		return NextResponse.json({error: 'Not available on Vercel'}, {status: 403});
	}

	await logger.debug(
		`[COMPANIES][UPDATE-RANKINGS][POST] ${endpoint.companies.update_rankings} called`,
		{
			env: {...env},
			deployment: {...deployment},
			headers: Object.fromEntries(request.headers.entries()),
		},
	);

	const {user, response} = await requireAuth(request);
	if (!user) {
		await logger.warn(
			'[COMPANIES][UPDATE-RANKINGS][POST] Unauthorized access attempt',
			{
				ip:
					request.headers.get('x-forwarded-for') || request.headers.get('host'),
			},
		);
		return response;
	}

	if (!deployment.isVercel) {
		try {
			const reqBody = await request.json();
			const parseResult = updateRankingsSchema.safeParse(reqBody);

			if (!parseResult.success) {
				await logger.warn(
					'[COMPANIES][UPDATE-RANKINGS][POST] Invalid update rankings payload',
					{
						issues: parseResult.error.issues,
						user: user.email,
					},
				);
				return NextResponse.json(
					{
						error: 'Invalid update rankings payload',
						details: parseResult.error.issues,
					},
					{status: 400},
				);
			}

			await logger.info(
				'[COMPANIES][UPDATE-RANKINGS][POST] Rankings update attempted',
				{
					user: user.email,
					payload: reqBody,
				},
			);

			await logger.warn(
				'[COMPANIES][UPDATE-RANKINGS][POST] Update rankings is not implemented for this environment',
				{
					user: user.email,
				},
			);
			return NextResponse.json(
				{error: 'Update rankings is not implemented in this environment'},
				{status: 501},
			);
		} catch (error) {
			await logger.error(
				'[COMPANIES][UPDATE-RANKINGS][POST] Error updating rankings',
				{
					error,
					user: user.email,
				},
			);
			return NextResponse.json(
				{
					error: 'Error updating rankings',
					details: (error as Error).message,
				},
				{status: 500},
			);
		}
	}
}
