import {NextResponse} from 'next/server';
import {openApiDocument} from '@/utils/openapi';

/**
 * GET /api/docs
 *
 * Returns the OpenAPI 3.0 specification for the Scoutly API
 * This endpoint serves the auto-generated documentation from Zod schemas
 */
export async function GET() {
	return NextResponse.json(openApiDocument, {
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET',
			'Access-Control-Allow-Headers': 'Content-Type',
		},
	});
}

/**
 * OPTIONS /api/docs
 *
 * CORS preflight support
 */
export async function OPTIONS() {
	return new NextResponse(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET',
			'Access-Control-Allow-Headers': 'Content-Type',
		},
	});
}
