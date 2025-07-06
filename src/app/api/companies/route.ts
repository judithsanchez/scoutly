import {NextRequest, NextResponse} from 'next/server';
import {Logger} from '@/utils/logger';
import {CompanyService} from '@/services/companyService';
import dbConnect from '@/middleware/database';
import mongoose from 'mongoose';
import {GetCompaniesResponseSchema} from '@/schemas/companySchemas';
import {ErrorResponseSchema} from '@/schemas/userSchemas';

const logger = new Logger('CompaniesAPI');

export async function GET(request: NextRequest) {
	try {
		// Connect using Mongoose
		await dbConnect();
		logger.info('Database connection established');

		// Get companies
		try {
			const companies = await CompanyService.getAllCompanies();
			logger.success(`Retrieved ${companies.length} companies`);

			// Serialize companies for Zod validation
			const serialized = companies.map((c: any) => ({
				...c.toObject(),
				_id: c._id?.toString?.() ?? c._id,
				lastSuccessfulScrape: c.lastSuccessfulScrape
					? new Date(c.lastSuccessfulScrape).toISOString()
					: undefined,
				createdAt: c.createdAt
					? new Date(c.createdAt).toISOString()
					: undefined,
				updatedAt: c.updatedAt
					? new Date(c.updatedAt).toISOString()
					: undefined,
				scrapeErrors: Array.isArray(c.scrapeErrors)
					? c.scrapeErrors.map((e: any) => e?.toString?.() ?? e)
					: [],
			}));

			// Validate response with Zod
			const response = GetCompaniesResponseSchema.parse(serialized);

			return NextResponse.json(response);
		} catch (error: any) {
			// Handle specific MongoDB errors
			if (error instanceof mongoose.Error) {
				logger.error('MongoDB operation error', error);
				return NextResponse.json(
					{error: 'Database operation failed. Please try again later.'},
					{status: 500},
				);
			}
			// Handle other errors
			logger.error('Failed to retrieve companies', error);
			return NextResponse.json(
				{error: error.message || 'Failed to retrieve companies'},
				{status: 500},
			);
		}
	} catch (error: any) {
		// Handle connection errors
		logger.error('Database connection error', error);
		return NextResponse.json(
			{error: 'Failed to connect to database. Please try again later.'},
			{status: 503}, // Service Unavailable
		);
	}
}
