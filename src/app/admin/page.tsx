'use client';

import {useSession} from 'next-auth/react';
import {useState, useEffect} from 'react';
import {isBootstrapAdmin} from '@/utils/adminUtils';
import {Button} from '@/components/ui/button';
import UserManagement from '@/components/admin/UserManagement';
import dynamic from 'next/dynamic';

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
	const {data: session, status} = useSession();
	const [dashboardData, setDashboardData] = useState<DashboardData | null>(
		null,
	);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<
		'dashboard' | 'users' | 'companies'
	>('dashboard');

	// Fetch dashboard data
	useEffect(() => {
		const fetchDashboardData = async () => {
			if (!session) return;

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
	}, [session]);

	// Handle authentication states
	if (status === 'loading') {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	if (status === 'unauthenticated') {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-gray-900 mb-4">
						Redirecting...
					</h1>
					<p className="text-gray-600">
						You need to be logged in to access this page.
					</p>
				</div>
			</div>
		);
	}

	// Check if user is admin (session-based)
	if (!session?.user?.isAdmin) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-red-600 mb-4">
						Access Denied
					</h1>
					<p className="text-gray-600">
						You do not have permission to access this page.
					</p>
				</div>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading dashboard data...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-red-600 mb-4">
						Error loading dashboard data
					</h1>
					<p className="text-gray-600 mb-4">{error}</p>
					<Button onClick={() => window.location.reload()} variant="outline">
						Retry
					</Button>
				</div>
			</div>
		);
	}

	if (!dashboardData) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<p className="text-gray-600">No dashboard data available</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Navigation */}
			<nav role="navigation" className="bg-white shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-4">
						<div className="flex items-center space-x-4">
							<h1 className="text-2xl font-bold text-gray-900">
								Admin Dashboard
							</h1>
						</div>
						<div className="flex items-center space-x-4">
							<span className="text-sm text-gray-600">
								Welcome, {session?.user?.email}
							</span>
						</div>
					</div>

					{/* Tab Navigation */}
					<div className="border-t border-gray-200">
						<nav className="-mb-px flex space-x-8" aria-label="Tabs">
							<button
								onClick={() => setActiveTab('dashboard')}
								className={`${
									activeTab === 'dashboard'
										? 'border-indigo-500 text-indigo-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
							>
								Dashboard
							</button>
							<button
								onClick={() => setActiveTab('users')}
								className={`${
									activeTab === 'users'
										? 'border-indigo-500 text-indigo-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
							>
								User Management
							</button>
							<button
								onClick={() => setActiveTab('companies')}
								className={`${
									activeTab === 'companies'
										? 'border-indigo-500 text-indigo-600'
										: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
								} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
							>
								Company Management
							</button>
						</nav>
					</div>
				</div>
			</nav>

			{/* Main Content */}
			<main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
				{activeTab === 'dashboard' && (
					<>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
							{/* System Health Card */}
							<div className="bg-white rounded-lg shadow p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									System Health
								</h3>
								<div className="space-y-2">
									<div className="flex items-center space-x-2">
										<div
											className={`w-3 h-3 rounded-full ${
												dashboardData.systemHealth?.status === 'healthy'
													? 'bg-green-500'
													: 'bg-red-500'
											}`}
										></div>
										<span className="text-sm font-medium capitalize">
											{dashboardData.systemHealth?.status || 'unknown'}
										</span>
									</div>
									<p className="text-sm text-gray-600">
										{dashboardData.systemHealth?.errorCount || 0} errors
									</p>
									<p className="text-sm text-gray-600">
										{dashboardData.systemHealth.totalLogs} total logs
									</p>
								</div>
							</div>

							{/* Recent Activity Card */}
							<div className="bg-white rounded-lg shadow p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									Recent Activity
								</h3>
								<div className="space-y-2">
									<p className="text-sm text-gray-600">
										Logs: {dashboardData.recentActivity.logsCount}
									</p>
									<p className="text-sm text-gray-600">
										Scrapes: {dashboardData.recentActivity.scrapesCount}
									</p>
									<p className="text-sm text-gray-600">
										Saved Jobs:{' '}
										<span className="font-medium">
											{dashboardData.recentActivity.savedJobsCount}
										</span>
									</p>
									<p className="text-sm text-gray-600">
										User Prefs: {dashboardData.recentActivity.userPrefsCount}
									</p>
								</div>
							</div>

							{/* Token Usage Card */}
							<div className="bg-white rounded-lg shadow p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									Token Usage
								</h3>
								<div className="space-y-2">
									<p className="text-2xl font-bold text-indigo-600">
										{dashboardData.tokenUsage.totalTokens.toLocaleString()}
									</p>
									<p className="text-sm text-gray-600">Total tokens used</p>
									<p className="text-sm text-gray-600">
										Cost: ${dashboardData.tokenUsage.totalCost.toFixed(2)}
									</p>
									<p className="text-sm text-gray-600">
										{dashboardData.tokenUsage.usageCount} API calls
									</p>
								</div>
							</div>

							{/* Company Stats Card */}
							<div className="bg-white rounded-lg shadow p-6">
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									Company Stats
								</h3>
								<div className="space-y-2">
									<p className="text-sm text-gray-600">
										Total: {dashboardData.companyStats.totalCompanies}
									</p>
									<p className="text-sm text-gray-600">
										Successful: {dashboardData.companyStats.successfulScrapes}
									</p>
									<p className="text-2xl font-bold text-green-600">
										{dashboardData.companyStats.successRate}%
									</p>
									<p className="text-sm text-gray-600">Success rate</p>
								</div>
							</div>
						</div>

						{/* Additional sections can be added here */}
						<div className="bg-white rounded-lg shadow p-6">
							<h3 className="text-lg font-semibold text-gray-900 mb-4">
								Dashboard Overview
							</h3>
							<p className="text-gray-600">
								This admin dashboard provides insights into system health, user
								activity, token usage, and company data scraping performance.
								Use this information to monitor the overall health and
								performance of the Scoutly platform.
							</p>
						</div>
					</>
				)}

				{activeTab === 'users' && <UserManagement />}
				{activeTab === 'companies' && <CompanyAdminPanel />}
			</main>
		</div>
	);
}
