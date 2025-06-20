'use client';

import React, {useState, useEffect, useMemo} from 'react';
import {CompanySelector} from '@/components/form/CompanySelector';
import SavedJobCard from '@/components/SavedJobCard';
import ApplicationPipeline from '@/components/ApplicationPipeline';
import StartScoutButton from '@/components/StartScoutButton';
import {ISavedJob, ApplicationStatus, statusPriority} from '@/types/savedJob';
import config from '@/config/appConfig';
import {createLogger} from '@/utils/frontendLogger';
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

	// Initialize logger with user context (memoized to prevent recreations)
	const logger = useMemo(() => createLogger('Dashboard', authInfo.gmail), [authInfo.gmail]);

	const [savedJobs, setSavedJobs] = useState<ISavedJob[]>([]);
	const [isLoadingJobs, setIsLoadingJobs] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
	const [searchComplete, setSearchComplete] = useState<{
		success: boolean;
		totalJobs: number;
	} | null>(null);

	const handleStatusChange = async (
		jobId: string,
		status: ApplicationStatus,
	) => {
		try {
			logger.logUserAction('Changed job status', {
				jobId,
				newStatus: status,
				userEmail: authInfo.gmail,
			});

			const url = '/api/jobs/saved/status';
			const requestBody = {
				jobId,
				status,
				gmail: authInfo.gmail,
			};

			logger.logApiRequest(url, 'PATCH', requestBody);

			const response = await fetch(url, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			logger.logApiResponse(url, response.status);

			if (!response.ok) {
				const data = await response.json();
				const errorMessage = data.error || 'Failed to update job status';
				logger.logApiError(url, new Error(errorMessage));
				throw new Error(errorMessage);
			}

			const updatedJob = await response.json();

			logger.info('Job status updated successfully', {
				jobId,
				newStatus: status,
				updatedJob,
				userEmail: authInfo.gmail,
			});

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
		} catch (err: any) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to update job status';

			logger.error('Error updating job status', {
				error: errorMessage,
				stack: err?.stack,
				jobId,
				status,
				userEmail: authInfo.gmail,
			});

			setError(errorMessage);
			logger.error('Failed to update job status', {error: err, jobId, status});
		}
	};

	const fetchSavedJobs = async () => {
		try {
			logger.info('Starting to fetch saved jobs', {userEmail: authInfo.gmail});
			setIsLoadingJobs(true);

			const url = `/api/jobs/saved?gmail=${encodeURIComponent(authInfo.gmail)}`;
			logger.logApiRequest(url, 'GET');

			const response = await fetch(url);
			const data = await response.json();

			logger.logApiResponse(url, response.status, data);

			if (!response.ok) {
				const errorMessage = data.error || 'Failed to fetch saved jobs';
				logger.logApiError(url, new Error(errorMessage));
				throw new Error(errorMessage);
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
			logger.info('Successfully fetched and sorted saved jobs', {
				jobCount: sortedJobs.length,
				userEmail: authInfo.gmail,
			});
		} catch (err: any) {
			const errorMessage =
				err.message || 'Unknown error occurred while fetching saved jobs';
			logger.error('Error fetching saved jobs', {
				error: errorMessage,
				stack: err.stack,
				userEmail: authInfo.gmail,
			});
			logger.error('Failed to fetch saved jobs', {error: err});
		} finally {
			setIsLoadingJobs(false);
			logger.debug('Finished fetching saved jobs (loading state set to false)');
		}
	};

	const handleSearchComplete = (success: boolean, totalJobs: number) => {
		setSearchComplete({success, totalJobs});
		if (success && totalJobs > 0) {
			fetchSavedJobs();
		}
	};

	useEffect(() => {
		logger.logComponentMount('DashboardPage', {userEmail: authInfo.gmail});
		fetchSavedJobs();

		return () => {
			logger.logComponentUnmount('DashboardPage');
		};
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
									logger.logUserAction('Started job search', {
										selectedCompanies: selectedCompanyIds,
										userEmail: authInfo.gmail,
									});

									setSearchComplete(null);
									try {
										// Step 1: Fetch user profile
										logger.info('Fetching user profile for job search');
										const userProfileUrl = '/api/users/profile';
										logger.logApiRequest(userProfileUrl, 'GET');

										const userResponse = await fetch(userProfileUrl);
										logger.logApiResponse(userProfileUrl, userResponse.status);

										if (!userResponse.ok) {
											const errorText = await userResponse.text();
											logger.error('Failed to fetch user profile', {
												status: userResponse.status,
												response: errorText,
												userEmail: authInfo.gmail,
											});
											throw new Error(
												`Failed to fetch user profile. Status: ${userResponse.status}`,
											);
										}
										const userData = await userResponse.json();

										logger.info('User profile fetched successfully', {
											hasCvUrl: !!userData.cvUrl,
											hasCandidateInfo: !!userData.candidateInfo,
											userEmail: authInfo.gmail,
										});

										// Step 2: Validate user profile completeness
										const missingFields = [];
										if (!userData.cvUrl) {
											missingFields.push('CV/Resume URL');
										}
										if (!userData.candidateInfo) {
											missingFields.push('candidate information');
										}

										if (missingFields.length > 0) {
											logger.warn('User profile incomplete', {
												missingFields,
												userEmail: authInfo.gmail,
											});
											throw new Error(
												`Please complete your profile first. Missing: ${missingFields.join(
													', ',
												)}. Visit your profile page to add this information.`,
											);
										}

										// Step 3: Prepare and send job search request
										const requestBody = {
											credentials: {
												gmail: authInfo.gmail,
											},
											companyIds: selectedCompanyIds,
											cvUrl: userData.cvUrl,
											candidateInfo: userData.candidateInfo,
										};

										logger.info('Sending job search request', {
											companyCount: selectedCompanyIds.length,
											companies: selectedCompanyIds,
											userEmail: authInfo.gmail,
										});

										const jobSearchUrl = '/api/jobs';
										logger.logApiRequest(jobSearchUrl, 'POST', requestBody);

										const searchResponse = await fetch(jobSearchUrl, {
											method: 'POST',
											headers: {
												'Content-Type': 'application/json',
											},
											body: JSON.stringify(requestBody),
										});

										logger.logApiResponse(jobSearchUrl, searchResponse.status);

										if (!searchResponse.ok) {
											const errorData = await searchResponse.json();

											logger.error('Job search request failed', {
												status: searchResponse.status,
												errorData,
												requestBody: {
													...requestBody,
													cvUrl: userData.cvUrl ? '[PRESENT]' : '[MISSING]',
													candidateInfo: userData.candidateInfo
														? '[PRESENT]'
														: '[MISSING]',
												},
												userEmail: authInfo.gmail,
											});

											// Enhanced error message handling for better UX
											let errorMessage =
												'An error occurred while searching for jobs';

											if (
												errorData.error === 'Validation failed' &&
												errorData.details
											) {
												errorMessage = `Missing required information: ${errorData.details.join(
													', ',
												)}. Please complete your profile.`;
											} else if (errorData.message) {
												errorMessage = errorData.message;
											} else if (errorData.error) {
												errorMessage = errorData.error;
											}

											throw new Error(errorMessage);
										}

										const searchData = await searchResponse.json();

										logger.info('Job search completed successfully', {
											searchData,
											userEmail: authInfo.gmail,
										});

										const totalJobs = searchData.results.reduce(
											(acc: number, company: any) => {
												return (
													acc + (company.processed ? company.results.length : 0)
												);
											},
											0,
										);

										logger.info('Job search results processed', {
											totalJobs,
											processedCompanies: searchData.results.filter(
												(r: any) => r.processed,
											).length,
											totalCompanies: searchData.results.length,
											userEmail: authInfo.gmail,
										});

										handleSearchComplete(true, totalJobs);
									} catch (err: any) {
										const catchErrorMessage =
											err?.message ||
											'An unexpected error occurred while searching for jobs';

										logger.error('Job search failed', {
											error: catchErrorMessage,
											stack: err?.stack,
											userEmail: authInfo.gmail,
											selectedCompanies: selectedCompanyIds,
										});

										logger.error('Failed to start scout', {error: err});

										// Store the error message for user feedback
										const errorMessage =
											err?.message ||
											'An unexpected error occurred while searching for jobs';

										// You can enhance this by setting error state if you want to show specific error messages to users
										// For now, we'll log the detailed error and show the search as incomplete
										logger.error('Detailed scout error info', {
											message: errorMessage,
											stack: err?.stack,
											timestamp: new Date().toISOString(),
										});

										handleSearchComplete(false, 0);
									}
								}}
								className="ml-2"
							/>
						</div>
					</div>
				</div>

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
