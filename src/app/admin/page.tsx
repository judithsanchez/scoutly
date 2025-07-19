'use client';

import dynamic from 'next/dynamic';
import CompanyScrapeHistoryPanel from '@/components/admin/CompanyScrapeHistoryPanel';

const CompanyAdminPanel = dynamic(
	() => import('@/components/admin/CompanyAdminPanel'),
	{ssr: false},
);

interface SystemHealth {
	status: string;
	errorCount: number;
	totalLogs: number;
}

interface RecentActivity {
	logsCount: number;
	scrapesCount: number;
	savedJobsCount: number;
	userPrefsCount: number;
}

interface TokenUsage {
	totalTokens: number;
	totalCost: number;
	usageCount: number;
}

interface CompanyStats {
	totalCompanies: number;
	successfulScrapes: number;
	successRate: number;
}

interface DashboardData {
	systemHealth: SystemHealth;
	recentActivity: RecentActivity;
	tokenUsage: TokenUsage;
	companyStats: CompanyStats;
}
export default function AdminDashboard() {
	return (
		<div className="min-h-screen bg-gray-50">
			<main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
				<CompanyScrapeHistoryPanel />
			</main>
		</div>
	);
}
