'use client';

import {useAuth} from '@/contexts/AuthContext';
import {useDashboard} from '@/hooks/useDashboard';
import {useRouter} from 'next/navigation';
import React, {useEffect, useState} from 'react';
import {useProfile} from '@/hooks/useProfile';
import {useJobs} from '@/hooks/useJobs';
import SavedJobCard from '@/components/SavedJobCard';
import {logger} from '@/utils/logger';
import {ApplicationStatus} from '@/types/savedJob';
import styles from './DashboardPage.module.css';
import DashboardSessionPanel from './components/DashboardSessionPanel';

export default function DashboardPage() {
	const {user} = useAuth();
	const router = useRouter();
	const {
		profile,
		loading: profileLoading,
		error: profileError,
		refetch: refetchProfile,
	} = useProfile();
	const {
		savedJobs,
		isLoadingJobs,
		error,
		fetchSavedJobs,
		updateJobStatus,
		setSavedJobs,
	} = useDashboard();
	const {searchJobs} = useJobs();
	const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
	const [searchComplete, setSearchComplete] = useState<{
		success: boolean;
		totalJobs: number;
	} | null>(null);

	const dashLogger = logger;

	useEffect(() => {
		if (!user) {
			router.replace('/login');
		}
	}, [user, router]);

	useEffect(() => {
		fetchSavedJobs();
	}, [fetchSavedJobs]);

	if (!user) {
		return <p>Redirecting to login...</p>;
	}

	if (profileLoading) {
		return <p>Loading profile...</p>;
	}

	if (profileError) {
		return <p>Error loading profile: {profileError}</p>;
	}

	const handleStatusChange = async (
		jobId: string,
		status: ApplicationStatus,
	): Promise<void> => {
		await updateJobStatus(jobId, status);
	};

	const handleDeleted = (jobId: string) => {
		setSavedJobs(currentJobs => currentJobs.filter(job => job._id !== jobId));
	};

	const handleSearchComplete = (success: boolean, totalJobs: number) => {
		setSearchComplete({success, totalJobs});
		if (success && totalJobs > 0) {
			fetchSavedJobs();
		}
	};

	return (
		<>
			<main className={styles.dashboardContainer}>
				<h1>Dashboard</h1>
				<p>Manage your job search and track your applications</p>
				{searchComplete && (
					<div
						className={[
							styles.banner,
							searchComplete.success
								? searchComplete.totalJobs > 0
									? styles.bannerSuccess
									: styles.bannerInfo
								: styles.bannerError,
						].join(' ')}
					>
						<div>
							{searchComplete.success
								? searchComplete.totalJobs > 0
									? `✓ Success! Found ${searchComplete.totalJobs} new positions that match your profile.`
									: '✓ Search completed successfully, but no new matching positions were found.'
								: '✗ There was a problem with the job search. Please try again.'}
						</div>
						<button
							onClick={() => setSearchComplete(null)}
							className={styles.closeButton}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<line x1="18" y1="6" x2="6" y2="18"></line>
								<line x1="6" y1="6" x2="18" y2="18"></line>
							</svg>
						</button>
					</div>
				)}
				<DashboardSessionPanel
					userEmail={user.email}
					profile={profile}
					dashLogger={dashLogger}
					searchJobs={searchJobs}
					handleSearchComplete={handleSearchComplete}
					setSearchComplete={setSearchComplete}
				/>
				<div className={styles.gridLayout}>
					<div className={styles.spaceY6}>
						<div className={styles.cardContainer}>
							<div className={styles.cardHeader}>
								<h3 className={styles.cardTitle}>Recent Saved Jobs</h3>
								<a href="/saved-jobs" className={styles.cardLink}>
									View All
								</a>
							</div>
							<div className={styles.jobsList}>
								{isLoadingJobs ? (
									<div className={styles.loading}>
										<p>Loading saved jobs...</p>
									</div>
								) : savedJobs.length === 0 ? (
									<div className={styles.empty}>
										<p>No saved jobs yet</p>
									</div>
								) : (
									<div className={styles.jobsSpaceY3}>
										{savedJobs.map(job => (
											<SavedJobCard
												key={job._id}
												job={job}
												compact
												onStatusChange={handleStatusChange}
												onDeleted={handleDeleted}
											/>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</main>
		</>
	);
}
