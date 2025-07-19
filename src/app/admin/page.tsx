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
import {
	PAGE_CONTENT_CONTAINER,
	CARD_CONTAINER,
	HEADING_LG,
	TEXT_SECONDARY,
} from '@/constants/styles';

export default function AdminDashboard() {
	return (
		<>
			<main
				className={PAGE_CONTENT_CONTAINER.replace('max-w-4xl', 'max-w-7xl')}
			>
				<div className="mb-8">
					<h1 className={HEADING_LG}>Admin Dashboard</h1>
					<p className={TEXT_SECONDARY}>
						View system logs, company scrape history, and manage admin
						operations.
					</p>
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					<div className="space-y-6">
						<section
							className={`${CARD_CONTAINER} bg-slate-800 border border-slate-700 text-slate-100 shadow-md`}
						>
							<AdminLogsPanel />
						</section>
					</div>
					<div className="space-y-6">
						<section
							className={`${CARD_CONTAINER} bg-slate-800 border border-slate-700 text-slate-100 shadow-md`}
						>
							<CompanyScrapeHistoryPanel />
						</section>
					</div>
				</div>
			</main>
		</>
	);
}
