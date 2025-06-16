import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {connectToDatabase} from '@/lib/mongodb';
import {User} from '@/models/User';
import {Company} from '@/models/Company';

// DELETE /api/users/tracked-companies/[companyId]
// Stop tracking a company
export async function DELETE(
	request: NextRequest,
	{params}: {params: {companyId: string}},
) {
	try {
		const session = await getServerSession();
		if (!session?.user?.email) {
			return NextResponse.json(
				{error: 'Authentication required'},
				{status: 401},
			);
		}

		const {companyId} = params;
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

		// Remove company from user's tracked companies
		const updated = await User.findOneAndUpdate(
			{
				email: session.user.email,
				trackedCompanies: companyId,
			},
			{
				$pull: {trackedCompanies: companyId},
			},
			{new: true},
		);

		if (!updated) {
			return NextResponse.json(
				{error: 'Company not being tracked'},
				{status: 400},
			);
		}

		return NextResponse.json({success: true});
	} catch (error) {
		console.error('Error untracking company:', error);
		return NextResponse.json({error: 'Internal server error'}, {status: 500});
	}
}
