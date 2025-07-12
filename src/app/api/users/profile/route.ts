import {NextResponse} from 'next/server';
import {getAllowedOrigin} from '@/utils/cors';
import {Logger} from '@/utils/logger';

const logger = new Logger('UsersProfileRoute');

function setCORSHeaders(res: NextResponse, req?: Request) {
	const requestOrigin = req?.headers.get('origin') || null;
	const allowedOrigin = getAllowedOrigin(requestOrigin);
	logger.debug('setCORSHeaders called', {requestOrigin, allowedOrigin});
	if (allowedOrigin) {
		res.headers.set('Access-Control-Allow-Origin', allowedOrigin);
		res.headers.set('Vary', 'Origin');
		logger.debug('Access-Control-Allow-Origin set', {allowedOrigin});
	} else {
		logger.warn('Origin not allowed, header not set', {requestOrigin});
	}
	res.headers.set('Access-Control-Allow-Credentials', 'true');
	res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
	res.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
	return res;
}

export const OPTIONS = async (req: Request) => {
	logger.debug('OPTIONS handler called for /api/users/profile');
	const res = new NextResponse(null, {status: 204});
	return setCORSHeaders(res, req);
};

export const GET = async (req: Request) => {
	logger.debug('GET handler called for /api/users/profile');
	try {
		logger.warn('Authentication removed from /api/users/profile');
		return setCORSHeaders(
			NextResponse.json(
				{error: 'Not implemented: authentication removed'},
				{status: 501},
			),
			req,
		);
	} catch (error) {
		logger.error('Unhandled error in GET /api/users/profile', error);
		return setCORSHeaders(
			NextResponse.json({error: 'Internal server error'}, {status: 500}),
			req,
		);
	}
};
