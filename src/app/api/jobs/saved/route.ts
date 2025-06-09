import {Logger} from '@/utils/logger';
import dbConnect from '@/middleware/database';
import {NextRequest, NextResponse} from 'next/server';
import {User} from '@/models/User';
import {SavedJob} from '@/models/SavedJob';

const logger = new Logger('SavedJobsAPI');

export async function GET(request: NextRequest) {
	try {
		await dbConnect();

		// Get gmail from query parameters
		const searchParams = request.nextUrl.searchParams;
		const gmail = searchParams.get('gmail');
		const limit = parseInt(searchParams.get('limit') || '10');
		const offset = parseInt(searchParams.get('offset') || '0');

		if (!gmail) {
			return NextResponse.json(
				{error: 'Gmail parameter is required.'},
				{status: 400},
			);
		}

		// Find user by email
		const user = await User.findOne({email: gmail.toLowerCase()});
		if (!user) {
			return NextResponse.json({error: 'User not found.'}, {status: 404});
		}

		// Get total count for pagination
		const total = await SavedJob.countDocuments({user: user._id});

		// Find all saved jobs for the user with pagination
		const savedJobs = await SavedJob.find({user: user._id})
			.populate(
				'company',
				'company websiteUrl careerPageUrl logo companySize industry',
			) // Only populate necessary company fields
			.sort({createdAt: -1}) // Most recent first
			.skip(offset)
			.limit(limit)
			.exec();

		logger.success(
			`Retrieved ${savedJobs.length} saved jobs for user ${gmail}`,
		);

		return NextResponse.json({
			jobs: savedJobs,
			total,
		});
	} catch (error: any) {
		logger.error('Error in /api/jobs/saved route:', {
			message: error.message,
			stack: error.stack,
		});
		return NextResponse.json(
			{error: error.message || 'An internal server error occurred.'},
			{status: 500},
		);
	}
}
