import {NextRequest, NextResponse} from 'next/server';
import {Logger} from '@/utils/logger';
import {CompanyService} from '@/services/companyService';
import dbConnect from '@/middleware/database';
import mongoose from 'mongoose';

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
			return NextResponse.json(companies);
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
