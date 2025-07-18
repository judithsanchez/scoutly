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

	   // Log environment variable presence for debugging
	   console.log('[PROXY][proxyToBackend] INTERNAL_API_SECRET present:', !!process.env.INTERNAL_API_SECRET);
	   console.log('[PROXY][proxyToBackend] JWT_SECRET present:', !!process.env.JWT_SECRET);

	   // Log incoming request headers
	   console.log('[PROXY][proxyToBackend] Incoming request headers:', Object.fromEntries(request.headers.entries()));

	   request.headers.forEach((value: string, key: string) => {
			   if (!['host', 'content-length'].includes(key.toLowerCase())) {
					   // Always set the internal API secret header to the value from config
					   if (key.toLowerCase() === header.INTERNAL_API_SECRET.toLowerCase()) {
							   headers[header.INTERNAL_API_SECRET] = secret.internalApiSecret ?? '';
					   } else {
							   headers[key] = value;
					   }
			   }
	   });

	   // Ensure the internal API secret header is present (case-insensitive)
	   if (!Object.keys(headers).some(k => k.toLowerCase() === header.INTERNAL_API_SECRET.toLowerCase())) {
			   headers[header.INTERNAL_API_SECRET] = secret.internalApiSecret ?? '';
	   }

	   // Log headers that will be sent to backend
	   console.log('[PROXY][proxyToBackend] Outgoing headers to backend:', headers);

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
