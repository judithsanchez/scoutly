import {NextRequest, NextResponse} from 'next/server';
import {logger} from '@/utils/logger';
import { secret, header } from '@/config/environment';

export async function proxyToBackend({
	request,
	backendUrl,
	methodOverride,
	logPrefix = '[PROXY]',
}: {
	request: NextRequest;
	backendUrl: string;
	methodOverride?: string;
	logPrefix?: string;
}) {
	const method = methodOverride || request.method;
	const headers: Record<string, string> = {};

	   request.headers.forEach((value: string, key: string) => {
			   if (!['host', 'content-length'].includes(key.toLowerCase())) {
					   if (key === header.INTERNAL_API_SECRET) {
							   headers[key] = secret.internalApiSecret ?? '';
					   } else {
							   headers[key] = value;
					   }
			   }
	   });

	   if (!(header.INTERNAL_API_SECRET in headers)) {
			   headers[header.INTERNAL_API_SECRET] = secret.internalApiSecret ?? '';
	   }

	let body: any = undefined;
	if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
		try {
			body = await request.text();
			if (body === '') body = undefined;
		} catch {}
	}

	await logger.debug(`${logPrefix} Proxying request to backend API`, {
		url: backendUrl,
		method,
		headers,
		hasBody: !!body,
	});

	const fetchOptions: RequestInit = {
		method,
		headers,
		body,
	};
	if (body === undefined) delete fetchOptions.body;

	const res = await fetch(backendUrl, fetchOptions);

	const contentType = res.headers.get('content-type') || '';
	let data;
	if (contentType.includes('application/json')) {
		data = await res.json();
	} else {
		data = await res.text();
	}

	await logger.info(`${logPrefix} Backend API responded`, {
		url: backendUrl,
		status: res.status,
		contentType,
	});

	return NextResponse.json(data, {status: res.status});
}
