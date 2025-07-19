import {useState, useEffect} from 'react';

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

export interface DashboardData {
	systemHealth: SystemHealth;
	recentActivity: RecentActivity;
	tokenUsage: TokenUsage;
	companyStats: CompanyStats;
}

export function useAdminDashboard() {
	const [dashboardData, setDashboardData] = useState<DashboardData | null>(
		null,
	);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchDashboardData = async () => {
			setLoading(true);
			setError(null);
			try {
				const response = await fetch('/api/admin/dashboard');
				if (!response.ok) {
					throw new Error('Failed to load dashboard data');
				}
				const data = await response.json();
				setDashboardData(data);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'An error occurred');
			} finally {
				setLoading(false);
			}
		};
		fetchDashboardData();
	}, []);

	return {
		dashboardData,
		loading,
		error,
		reload: () => {
			// force reload
			setDashboardData(null);
			setLoading(true);
			setError(null);
			fetch('/api/admin/dashboard')
				.then(res => res.json())
				.then(setDashboardData)
				.catch(err => setError(err.message || 'An error occurred'))
				.finally(() => setLoading(false));
		},
	};
}
