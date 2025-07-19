'use client';

import {useAuth} from '@/contexts/AuthContext';
import {useDashboard} from '@/hooks/useDashboard';
import {useRouter} from 'next/navigation';
import React, {useEffect, useState} from 'react';
import {useProfile} from '@/hooks/useProfile';
import StartScoutButton from '@/components/StartScoutButton';
import {useJobs} from '@/hooks/useJobs';
import SavedJobCard from '@/components/SavedJobCard';
import {logger} from '@/utils/logger';
import {ApplicationStatus} from '@/types/savedJob';
import styles from './DashboardPage.module.css';

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
		// Optionally add logger if needed
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
				<div className={styles.cardContainer}>
					<div className={styles.flexBetween}>
						<div>
							<h2 className="text-lg font-medium text-[var(--text-color)]">
								Current Session
							</h2>
							<p className="text-purple-400 font-medium mt-1">{user.email}</p>
						</div>
						<div className={styles.buttonGroup}>
							<a href="/profile" className={styles.cardLink}>
								Edit Profile
							</a>
							<StartScoutButton
								onScoutStart={async selectedCompanyIds => {
									dashLogger?.info('User Action: Started job search', {
										selectedCompanies: selectedCompanyIds,
									});
									setSearchComplete(null);
									try {
										if (!profile) {
											throw new Error(
												'User profile not loaded. Please try again.',
											);
										}
										const candidateInfo = profile.candidateInfo || {};
										const cvUrl = profile.cvUrl || null;
										if (!cvUrl) {
											throw new Error(
												'Please complete your profile first. Missing: CV/Resume URL. Visit your profile page to add this information.',
											);
										}
										const requestBody = {
											credentials: {gmail: ''},
											companyIds: selectedCompanyIds,
											cvUrl,
											candidateInfo,
										};
										dashLogger?.info('Sending job search request', {
											companyCount: selectedCompanyIds.length,
											companies: selectedCompanyIds,
										});
										dashLogger?.info(
											'API Request: POST /api/jobs',
											requestBody,
										);
										let searchData;
										try {
											searchData = await searchJobs(requestBody);
										} catch (err: any) {
											dashLogger?.error('Job search request failed', {
												error: err,
												requestBody: {
													...requestBody,
													cvUrl: cvUrl ? '[PRESENT]' : '[MISSING]',
													candidateInfo: candidateInfo
														? '[PRESENT]'
														: '[MISSING]',
												},
											});
											let errorMessage =
												err?.message ||
												'An error occurred while searching for jobs';
											throw new Error(errorMessage);
										}
										dashLogger?.info('Job search completed successfully', {
											searchData,
										});
										const totalJobs = searchData.results.reduce(
											(acc: number, company: any) => {
												return (
													acc + (company.processed ? company.results.length : 0)
												);
											},
											0,
										);
										dashLogger?.info('Job search results processed', {
											totalJobs,
											processedCompanies: searchData.results.filter(
												(r: any) => r.processed,
											).length,
											totalCompanies: searchData.results.length,
										});
										handleSearchComplete(true, totalJobs);
									} catch (err: any) {
										const catchErrorMessage =
											err?.message ||
											'An unexpected error occurred while searching for jobs';
										dashLogger?.error('Job search failed', {
											error: catchErrorMessage,
											stack: err?.stack,
											selectedCompanies: selectedCompanyIds,
										});
										dashLogger?.error('Failed to start scout', {error: err});
										const errorMessage =
											err?.message ||
											'An unexpected error occurred while searching for jobs';
										dashLogger?.error('Detailed scout error info', {
											message: errorMessage,
											stack: err?.stack,
											timestamp: new Date().toISOString(),
										});
										handleSearchComplete(false, 0);
									}
								}}
								className={styles.ml2}
							/>
						</div>
					</div>
				</div>
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
