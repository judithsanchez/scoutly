import {NextRequest, NextResponse} from 'next/server';
import {requireAuth} from '@/utils/requireAuth';
import {env, deployment, apiBaseUrl} from '@/config/environment';
import {endpoint} from '@/constants';
import {proxyToBackend} from '@/utils/proxyToBackend';

let SavedJobService: any;
try {
	SavedJobService = require('@/services/savedJobService').SavedJobService;
} catch {}

export async function DELETE(
	req: NextRequest,
	{params}: {params: {id: string}},
) {
	if (deployment.isVercel && env.isProd) {
		const apiUrlFull = `${apiBaseUrl.prod}${endpoint.jobs.saved}/${params.id}`;
		return proxyToBackend({
			request: req,
			backendUrl: apiUrlFull,
			methodOverride: 'DELETE',
			logPrefix: '[JOBS][SAVED][PROXY][DELETE]',
		});
	}

	const {user, response} = await requireAuth(req);
	if (!user) {
		return response as Response;
	}

	if (!SavedJobService) {
		return NextResponse.json(
			{error: 'SavedJobService not implemented'},
			{status: 501},
		);
	}

	try {
		await SavedJobService.deleteSavedJobById(params.id);
		return NextResponse.json({success: true});
	} catch (err: any) {
		return NextResponse.json(
			{error: err.message || 'Failed to delete saved job'},
			{status: 403},
		);
	}
}
