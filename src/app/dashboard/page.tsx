'use client';

import React, {useState, useEffect} from 'react';
import {CompanySelector} from '@/components/form/CompanySelector';
import {SearchModal} from '@/components/SearchModal';
import SavedJobCard from '@/components/SavedJobCard';
import ApplicationPipeline from '@/components/ApplicationPipeline';
import StartScoutButton from '@/components/StartScoutButton';
import {ISavedJob, ApplicationStatus, statusPriority} from '@/types/savedJob';
import config from '@/config/appConfig';
import {
	PAGE_BACKGROUND_CONTAINER,
	PAGE_BACKGROUND_GLOW,
	PAGE_CONTENT_CONTAINER,
	CARD_CONTAINER,
	BUTTON_PRIMARY,
	HEADING_LG,
	TEXT_SECONDARY,
	FLEX_BETWEEN,
	BUTTON_SECONDARY,
	TEXT_ACCENT,
	STAT_CARD_CONTAINER,
	STAT_CARD_NUMBER_PURPLE,
	STAT_CARD_NUMBER_GREEN,
	STAT_CARD_NUMBER_YELLOW,
	STAT_CARD_NUMBER_BLUE,
} from '@/constants/styles';

export default function DashboardPage() {
	const authInfo = {
		gmail: 'judithv.sanchezc@gmail.com',
	};

	const [savedJobs, setSavedJobs] = useState<ISavedJob[]>([]);
	const [isLoadingJobs, setIsLoadingJobs] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
	const [isSearchModalOpen, setSearchModalOpen] = useState(false);
	const [searchRequestBody, setSearchRequestBody] = useState<any>(null);
	const [searchComplete, setSearchComplete] = useState<{
		success: boolean;
		totalJobs: number;
	} | null>(null);

	const handleStatusChange = async (
		jobId: string,
		status: ApplicationStatus,
	) => {
		try {
			const response = await fetch('/api/jobs/saved/status', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					jobId,
					status,
					gmail: authInfo.gmail,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to update job status');
			}

			const updatedJob = await response.json();

			// Update jobs list with new status and resort
			setSavedJobs(currentJobs => {
				const updatedJobs = currentJobs.map(job =>
					job._id === jobId ? {...job, ...updatedJob} : job,
				);

				// Sort by status priority and suitability score
				return updatedJobs.sort((a: ISavedJob, b: ISavedJob) => {
					// First compare by status priority
					const statusDiff =
						statusPriority[a.status as ApplicationStatus] -
						statusPriority[b.status as ApplicationStatus];
					if (statusDiff !== 0) return -statusDiff;

					// If status is the same, sort by suitability score (highest first)
					return b.suitabilityScore - a.suitabilityScore;
				});
			});
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Failed to update job status',
			);
			console.error('Error updating job status:', err);
		}
	};

	const fetchSavedJobs = async () => {
		try {
			setIsLoadingJobs(true);
			const response = await fetch(
				`/api/jobs/saved?gmail=${encodeURIComponent(authInfo.gmail)}`,
			);

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || 'Failed to fetch saved jobs');
			}

			// Sort jobs by status priority and suitability score
			const sortedJobs = data.jobs.sort((a: ISavedJob, b: ISavedJob) => {
				// First compare by status priority
				const statusDiff =
					statusPriority[a.status as ApplicationStatus] -
					statusPriority[b.status as ApplicationStatus];
				if (statusDiff !== 0) return -statusDiff;

				// If status is the same, sort by suitability score (highest first)
				return b.suitabilityScore - a.suitabilityScore;
			});

			setSavedJobs(sortedJobs);
		} catch (err) {
			console.error('Error fetching saved jobs:', err);
		} finally {
			setIsLoadingJobs(false);
		}
	};

	const handleSearchComplete = (success: boolean, totalJobs: number) => {
		setSearchComplete({success, totalJobs});
		if (success && totalJobs > 0) {
			fetchSavedJobs();
		}
	};

	useEffect(() => {
		fetchSavedJobs();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [authInfo.gmail]);

	return (
		<div className={PAGE_BACKGROUND_CONTAINER}>
			<div className={PAGE_BACKGROUND_GLOW}></div>
			<main
				className={PAGE_CONTENT_CONTAINER.replace('max-w-4xl', 'max-w-7xl')}
			>
				<div className="mb-8">
					<h1 className={HEADING_LG}>Dashboard</h1>
					<p className={TEXT_SECONDARY}>
						Manage your job search and track your applications
					</p>

					{searchComplete && (
						<div
							className={`mt-4 p-4 rounded-lg border flex justify-between items-center ${
								searchComplete.success
									? searchComplete.totalJobs > 0
										? 'bg-green-900/20 border-green-600 text-green-400'
										: 'bg-blue-900/20 border-blue-600 text-blue-400'
									: 'bg-red-900/20 border-red-600 text-red-400'
							}`}
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
								className="p-1 hover:bg-slate-700 rounded-full"
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
				</div>

				<div className={`${CARD_CONTAINER} mb-8`}>
					<div className={FLEX_BETWEEN}>
						<div>
							<h2 className="text-lg font-medium text-[var(--text-color)]">
								Current Session
							</h2>
							<p className="text-purple-400 font-medium mt-1">
								{authInfo.gmail}
							</p>
						</div>
						<div className="flex gap-3">
							<a href="/profile" className={BUTTON_SECONDARY}>
								Edit Profile
							</a>
							<StartScoutButton
								onScoutStart={async selectedCompanyIds => {
									setSearchComplete(null);
									const userResponse = await fetch('/api/user/profile');
									const userData = await userResponse.json();

									const requestBody = {
										credentials: authInfo,
										companyIds: selectedCompanyIds,
										cvUrl: userData.cvUrl,
										candidateInfo: userData.candidateProfile,
									};
									setSearchRequestBody(requestBody);
									setSearchModalOpen(true);
								}}
								className="ml-2"
							/>
						</div>
					</div>
				</div>

				<SearchModal
					isOpen={isSearchModalOpen}
					onClose={() => setSearchModalOpen(false)}
					requestBody={searchRequestBody}
					onSearchComplete={handleSearchComplete}
				/>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					<div className="space-y-6">
						<div className={CARD_CONTAINER}>
							<h3 className="text-lg font-bold text-white mb-4">
								Target Companies
							</h3>
							<CompanySelector
								selectedCompanies={selectedCompanies}
								onCompaniesChange={setSelectedCompanies}
							/>
						</div>

						<div className={CARD_CONTAINER}>
							<h3 className="text-lg font-bold text-white mb-4">Quick Stats</h3>
							<div className="grid grid-cols-2 gap-4">
								<div className={STAT_CARD_CONTAINER}>
									<div className={STAT_CARD_NUMBER_PURPLE}>
										{savedJobs.length}
									</div>
									<div className={TEXT_SECONDARY}>Total Saved</div>
								</div>
								<div className={STAT_CARD_CONTAINER}>
									<div className={STAT_CARD_NUMBER_GREEN}>
										{
											savedJobs.filter(
												job => job.status === ApplicationStatus.APPLIED,
											).length
										}
									</div>
									<div className={TEXT_SECONDARY}>Applied</div>
								</div>
								<div className={STAT_CARD_CONTAINER}>
									<div className={STAT_CARD_NUMBER_YELLOW}>
										{
											savedJobs.filter(
												job => job.status === ApplicationStatus.WANT_TO_APPLY,
											).length
										}
									</div>
									<div className={TEXT_SECONDARY}>Want to Apply</div>
								</div>
								<div className={STAT_CARD_CONTAINER}>
									<div className={STAT_CARD_NUMBER_BLUE}>
										{selectedCompanies.length}
									</div>
									<div className={TEXT_SECONDARY}>Target Companies</div>
								</div>
							</div>
						</div>
					</div>

					<div className="space-y-6">
						<div className={CARD_CONTAINER}>
							<div className={`${FLEX_BETWEEN} mb-4`}>
								<h3 className="text-lg font-bold text-white">
									Recent Saved Jobs
								</h3>
								<a href="/saved-jobs" className={`${TEXT_ACCENT} text-sm`}>
									View All
								</a>
							</div>
							<div className="min-h-[400px] max-h-[calc(100vh-20rem)] overflow-y-auto pr-2">
								{isLoadingJobs ? (
									<div
										className={`flex items-center justify-center h-32 ${TEXT_SECONDARY}`}
									>
										<p>Loading saved jobs...</p>
									</div>
								) : savedJobs.length === 0 ? (
									<div
										className={`flex flex-col items-center justify-center h-32 ${TEXT_SECONDARY}`}
									>
										<p>No saved jobs yet</p>
									</div>
								) : (
									<div className="space-y-3">
										{savedJobs.map(job => (
											<SavedJobCard
												key={job._id}
												job={job}
												compact
												onStatusChange={handleStatusChange}
											/>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{config.features.enableKanbanView && savedJobs.length > 0 && (
					<div className={`mt-8 ${CARD_CONTAINER} p-6`}>
						<ApplicationPipeline
							jobs={savedJobs}
							onStatusChange={handleStatusChange}
						/>
					</div>
				)}
			</main>
		</div>
	);
}
