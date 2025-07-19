'use client';

import dynamic from 'next/dynamic';

import CompanyScrapeHistoryPanel from '@/components/admin/CompanyScrapeHistoryPanel';
import AdminLogsPanel from '@/components/admin/AdminLogsPanel';

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
		<>
			<main className="page-content-container">
				<div className="mb-8">
					<h1 className="heading-lg">Admin Dashboard</h1>
					<p className="text-secondary">
						View system logs, company scrape history, and manage admin
						operations.
					</p>
				</div>
				<div className="grid-2col">
					<div className="space-y-6">
						<section className="card-container">
							<AdminLogsPanel />
						</section>
					</div>
					<div className="space-y-6">
						<section className="card-container">
							<CompanyScrapeHistoryPanel />
						</section>
					</div>
				</div>
			</main>
		</>
	);
}
