import {Logger} from '@/utils/logger';
import dbConnect from '@/middleware/database';
import {NextRequest, NextResponse} from 'next/server';
import {User} from '@/models/User';
import {SavedJob} from '@/models/SavedJob';

const logger = new Logger('SavedJobsAPI');

export async function GET(request: NextRequest) {
	try {
		const mongoUri =
			process.env.MONGODB_URI || 'mongodb://mongodb:27017/scoutly';
		logger.info('MongoDB URI:', mongoUri);
		logger.info('Connecting to database...');

		const db = await dbConnect();
		logger.info('Database connected successfully');
		logger.info('Collections:', Object.keys(db.models));
		logger.info('SavedJob model:', SavedJob.collection.name);

		const searchParams = request.nextUrl.searchParams;
		const gmail = searchParams.get('gmail');
		logger.info('Received request for email:', gmail);
		const limit = parseInt(searchParams.get('limit') || '10');
		const offset = parseInt(searchParams.get('offset') || '0');

		if (!gmail) {
			return NextResponse.json(
				{error: 'Gmail parameter is required.'},
				{status: 400},
			);
		}

		logger.info('Looking up user:', gmail?.toLowerCase());
		const user = await User.findOne({email: gmail?.toLowerCase()});
		logger.info('User query result:', user);
		if (!user) {
			logger.error('User not found:', gmail?.toLowerCase());
			return NextResponse.json({error: 'User not found.'}, {status: 404});
		}
		logger.info('Found user:', user._id.toString());

		const total = await SavedJob.countDocuments({userId: user._id.toString()});

		logger.info('Finding saved jobs for user:', user._id.toString());

		const savedJobs = await SavedJob.find({userId: user._id.toString()})
			.populate(
				'companyId',
				'company websiteUrl careerPageUrl logo companySize industry',
			)
			.sort({createdAt: -1})
			.skip(offset)
			.limit(limit)
			.exec();

		logger.info('Populated saved jobs:', JSON.stringify(savedJobs));

		// Transform the data to match frontend interface
		const transformedJobs = savedJobs.map(job => ({
			...job.toObject(),
			user: job.userId,
			company: job.companyId,
		}));

		logger.success(
			`Retrieved ${savedJobs.length} saved jobs for user ${gmail}`,
		);

		return NextResponse.json({
			jobs: transformedJobs,
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
