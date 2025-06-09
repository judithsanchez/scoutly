import {Logger} from '@/utils/logger';
import dbConnect from '@/middleware/database';
import {NextRequest, NextResponse} from 'next/server';
import {User} from '@/models/User';
import {SavedJob, ApplicationStatus} from '@/models/SavedJob';

const logger = new Logger('SavedJobsStatusAPI');

export async function GET(request: NextRequest) {
	try {
		await dbConnect();

		// Get parameters from query string
		const searchParams = request.nextUrl.searchParams;
		const gmail = searchParams.get('gmail');
		const status = searchParams.get('status');
		const limit = parseInt(searchParams.get('limit') || '10');
		const offset = parseInt(searchParams.get('offset') || '0');

		// Validate required parameters
		if (!gmail || !status) {
			return NextResponse.json(
				{error: 'Gmail and status parameters are required.'},
				{status: 400},
			);
		}

		// Validate status value
		if (
			!Object.values(ApplicationStatus).includes(status as ApplicationStatus)
		) {
			return NextResponse.json(
				{
					error: `Invalid status. Must be one of: ${Object.values(
						ApplicationStatus,
					).join(', ')}`,
				},
				{status: 400},
			);
		}

		// Find user by email
		const user = await User.findOne({email: gmail.toLowerCase()});
		if (!user) {
			return NextResponse.json({error: 'User not found.'}, {status: 404});
		}

		// Get total count for pagination
		const total = await SavedJob.countDocuments({
			user: user._id,
			status: status,
		});

		// Find all saved jobs for the user with the specified status
		const savedJobs = await SavedJob.find({
			user: user._id,
			status: status,
		})
			.populate(
				'company',
				'company websiteUrl careerPageUrl logo companySize industry',
			)
			.sort({createdAt: -1})
			.skip(offset)
			.limit(limit)
			.exec();

		logger.success(
			`Retrieved ${savedJobs.length} saved jobs with status ${status} for user ${gmail}`,
		);

		return NextResponse.json({
			jobs: savedJobs,
			total,
			status: status,
		});
	} catch (error: any) {
		logger.error('Error in /api/jobs/saved/status route:', {
			message: error.message,
			stack: error.stack,
		});
		return NextResponse.json(
			{error: error.message || 'An internal server error occurred.'},
			{status: 500},
		);
	}
}
