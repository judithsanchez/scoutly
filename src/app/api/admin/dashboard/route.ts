import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth/next';
import {isAdminUser} from '@/utils/adminUtils';
import {connectToDatabase} from '@/lib/mongodb';
import {Log} from '@/models/Log';
import {TokenUsage} from '@/models/TokenUsage';
import {CompanyScrapeHistory} from '@/models/CompanyScrapeHistory';
import {SavedJob} from '@/models/SavedJob';
import {UserCompanyPreference} from '@/models/UserCompanyPreference';

export async function GET(request: NextRequest) {
	try {
		// Check authentication
		const session = await getServerSession();
		if (!session?.user?.email) {
			return NextResponse.json({error: 'Unauthorized'}, {status: 401});
		}

		// Check admin access
		if (!isAdminUser(session.user.email)) {
			return NextResponse.json({error: 'Forbidden'}, {status: 403});
		}

		// Connect to database
		await connectToDatabase();

		// Fetch dashboard data
		const dashboardData = await getDashboardData();

		return NextResponse.json(dashboardData);
	} catch (error) {
		console.error('Admin dashboard error:', error);
		return NextResponse.json({error: 'Internal server error'}, {status: 500});
	}
}

async function getDashboardData() {
	// Get recent logs for system health
	const recentLogs = await Log.find().sort({timestamp: -1}).limit(50).lean();

	// Get today's token usage
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const tokenUsage = await TokenUsage.find({
		timestamp: {$gte: today},
	}).lean();

	// Get recent company scraping activity
	const recentScrapes = await CompanyScrapeHistory.find()
		.sort({timestamp: -1})
		.limit(20)
		.lean();

	// Get saved jobs count
	const savedJobsCount = await SavedJob.countDocuments();

	// Get user preferences stats
	const userPrefsCount = await UserCompanyPreference.countDocuments();

	// Calculate system health metrics
	const errorLogs = recentLogs.filter(log => log.level === 'error');
	const systemHealth = {
		status: errorLogs.length > 5 ? 'warning' : 'healthy',
		errorCount: errorLogs.length,
		totalLogs: recentLogs.length,
	};

	// Calculate token usage summary
	const totalTokens = tokenUsage.reduce(
		(sum, usage) => sum + usage.actualTokens,
		0,
	);
	const totalCost = tokenUsage.reduce(
		(sum, usage) => sum + (usage.costEstimate?.total || 0),
		0,
	);

	// Calculate company stats
	const successfulScrapes = recentScrapes.filter(scrape => scrape.success);
	const companyStats = {
		totalCompanies: recentScrapes.length,
		successfulScrapes: successfulScrapes.length,
		successRate:
			recentScrapes.length > 0
				? (successfulScrapes.length / recentScrapes.length) * 100
				: 0,
	};

	return {
		systemHealth,
		recentActivity: {
			logsCount: recentLogs.length,
			scrapesCount: recentScrapes.length,
			savedJobsCount,
			userPrefsCount,
		},
		tokenUsage: {
			totalTokens,
			totalCost,
			usageCount: tokenUsage.length,
		},
		companyStats,
	};
}
