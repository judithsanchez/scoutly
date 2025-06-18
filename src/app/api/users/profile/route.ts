import {NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import dbConnect from '@/middleware/database';
import {User} from '@/models/User';
import {Logger} from '@/utils/logger';

const logger = new Logger('UserProfileAPI');

// PUT /api/users/profile
// Update user's profile information
export async function PUT(request: Request) {
	try {
		await dbConnect();

		const userEmail =
			process.env.NODE_ENV === 'development'
				? 'judithv.sanchezc@gmail.com'
				: (await getServerSession())?.user?.email;

		if (!userEmail) {
			logger.warn('Authentication required attempt');
			return NextResponse.json(
				{error: 'Authentication required'},
				{status: 401},
			);
		}

		const updateData = await request.json();
		const {cvUrl, candidateInfo} = updateData;

		// Only allow updating cvUrl and candidateInfo
		const user = await User.findOneAndUpdate(
			{email: userEmail},
			{$set: {cvUrl, candidateInfo}},
			{new: true}, // Return updated document
		).populate('trackedCompanies');

		if (!user) {
			logger.warn(`User ${userEmail} not found.`);
			return NextResponse.json({error: 'User not found'}, {status: 404});
		}

		logger.success(`Updated profile for user ${userEmail}`);
		return NextResponse.json(user);
	} catch (error: any) {
		logger.error('Error updating user profile', error);
		return NextResponse.json(
			{error: 'Internal server error', details: error.message},
			{status: 500},
		);
	}
}

// GET /api/users/profile
// Get user's profile information
export async function GET() {
	try {
		await dbConnect();
		logger.info('Database connection established');

		const userEmail =
			process.env.NODE_ENV === 'development'
				? 'judithv.sanchezc@gmail.com'
				: (await getServerSession())?.user?.email;

		if (!userEmail) {
			logger.warn('Authentication required - no user email found', {
				nodeEnv: process.env.NODE_ENV,
				hasSession: !!(await getServerSession()),
			});
			return NextResponse.json(
				{error: 'Authentication required'},
				{status: 401},
			);
		}

		logger.info('Looking up user profile', {userEmail});

		let user = await User.findOne({email: userEmail}).populate(
			'trackedCompanies',
		); // Populate tracked companies

		if (!user && process.env.NODE_ENV === 'development') {
			logger.info(`User ${userEmail} not found in dev, creating...`);
			user = await User.create({
				email: userEmail,
				trackedCompanies: [],
			});
			logger.success(`User ${userEmail} created in dev mode.`);
		} else if (!user) {
			logger.warn(`User ${userEmail} not found in database.`, {
				userEmail,
				nodeEnv: process.env.NODE_ENV,
			});
			return NextResponse.json({error: 'User not found'}, {status: 404});
		}

		// Log profile completeness for debugging
		logger.info('User profile retrieved', {
			userEmail,
			hasCvUrl: !!user.cvUrl,
			hasCandidateInfo: !!user.candidateInfo,
			trackedCompaniesCount: user.trackedCompanies?.length || 0,
			cvUrl: user.cvUrl || 'NOT SET',
			candidateInfoKeys: user.candidateInfo
				? Object.keys(user.candidateInfo).join(', ')
				: 'NOT SET',
		});

		logger.success(`Retrieved profile for user ${userEmail}`);
		// Return all user fields, Mongoose lean() can be used for plain JS object
		// and to exclude virtuals if any, but for now, direct object is fine.
		return NextResponse.json(user);
	} catch (error: any) {
		logger.error('Error fetching user profile', {
			message: error.message,
			stack: error.stack,
			name: error.name,
		});
		return NextResponse.json(
			{error: 'Internal server error', details: error.message},
			{status: 500},
		);
	}
}
