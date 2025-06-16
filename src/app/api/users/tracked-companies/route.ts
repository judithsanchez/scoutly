import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {connectToDatabase} from '@/lib/mongodb';
import {User} from '@/models/User';
import {Company} from '@/models/Company';

// GET /api/users/tracked-companies
// Get user's tracked companies
export async function GET() {
	try {
		const session = await getServerSession();
		if (!session?.user?.email) {
			return NextResponse.json(
				{error: 'Authentication required'},
				{status: 401},
			);
		}

		await connectToDatabase();

		const user = await User.findOne({email: session.user.email}).populate(
			'trackedCompanies',
		);
		if (!user) {
			return NextResponse.json({error: 'User not found'}, {status: 404});
		}

		return NextResponse.json({companies: user.trackedCompanies});
	} catch (error) {
		console.error('Error fetching tracked companies:', error);
		return NextResponse.json({error: 'Internal server error'}, {status: 500});
	}
}

// POST /api/users/tracked-companies
// Start tracking a company
export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession();
		if (!session?.user?.email) {
			return NextResponse.json(
				{error: 'Authentication required'},
				{status: 401},
			);
		}

		const {companyId} = await request.json();
		if (!companyId) {
			return NextResponse.json(
				{error: 'Company ID is required'},
				{status: 400},
			);
		}

		await connectToDatabase();

		// Verify company exists
		const company = await Company.findOne({companyID: companyId});
		if (!company) {
			return NextResponse.json({error: 'Company not found'}, {status: 404});
		}

		// Add company to user's tracked companies if not already tracking
		const updated = await User.findOneAndUpdate(
			{
				email: session.user.email,
				trackedCompanies: {$ne: companyId},
			},
			{
				$addToSet: {trackedCompanies: companyId},
			},
			{new: true},
		);

		if (!updated) {
			return NextResponse.json(
				{error: 'Already tracking this company'},
				{status: 400},
			);
		}

		return NextResponse.json({success: true});
	} catch (error) {
		console.error('Error tracking company:', error);
		return NextResponse.json({error: 'Internal server error'}, {status: 500});
	}
}
