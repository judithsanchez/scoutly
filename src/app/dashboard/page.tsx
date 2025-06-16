'use client';

import React, {useState, useEffect} from 'react';
import {CompanySelector} from '@/components/form/CompanySelector';
import {SearchModal} from '@/components/SearchModal';
import SavedJobCard from '@/components/SavedJobCard';
import {ISavedJob, ApplicationStatus} from '@/types/savedJob';

// --- STYLING & ICONS ---
const cardClasses =
	'bg-slate-800/50 border border-slate-700 rounded-2xl p-4 shadow-lg';
const buttonClasses =
	'px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const primaryButtonClasses = `${buttonClasses} bg-purple-600 text-white hover:bg-purple-700 shadow-md`;

// Default data for search functionality
const DEFAULT_CANDIDATE_DATA = {
	cvUrl:
		'https://drive.google.com/file/d/1-0NUsEx0HmnTmcpMOjGSKdOJJ1Vd_uWL/view?usp=drive_link',
	candidateInfo: {
		logistics: {
			currentResidence: {
				city: 'Utrecht',
				country: 'Netherlands',
				countryCode: 'NL',
				timezone: 'Europe/Amsterdam',
			},
			willingToRelocate: true,
			workAuthorization: [
				{
					region: 'European Union',
					regionCode: 'EU',
					status: 'Citizen',
				},
			],
		},
		languages: [
			{language: 'Spanish', level: 'C2'},
			{language: 'English', level: 'C1'},
			{language: 'Dutch', level: 'B1'},
		],
		preferences: {
			careerGoals: [
				'Work with a modern tech stack like Next.js and Tailwind CSS',
				'Transition into a Senior Engineer role',
				'Contribute to a high-impact, user-facing product',
			],
			jobTypes: ['Full-time', 'Part-time'],
			workEnvironments: ['Remote', 'Hybrid'],
			companySizes: ['Start-ups', 'Mid-size (51-1000)', 'Large (1001+)'],
			exclusions: {
				industries: ['Gambling', 'Defense Contracting'],
				technologies: ['PHP', 'WordPress', 'jQuery'],
				roleTypes: [
					'100% on-call support',
					'Roles with heavy project management duties',
				],
			},
		},
	},
};

export default function DashboardPage() {
	// Mock authenticated user
	const authInfo = {
		gmail: 'judithv.sanchezc@gmail.com',
	};

	const [savedJobs, setSavedJobs] = useState<ISavedJob[]>([]);
	const [isLoadingJobs, setIsLoadingJobs] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
	const [isSearchModalOpen, setSearchModalOpen] = useState(false);
	const [searchRequestBody, setSearchRequestBody] = useState<any>(null);

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
					const statusPriority: Record<ApplicationStatus, number> = {
						[ApplicationStatus.WANT_TO_APPLY]: 3,
						[ApplicationStatus.PENDING_APPLICATION]: 2,
						[ApplicationStatus.APPLIED]: 1,
						[ApplicationStatus.DISCARDED]: 0,
					};

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

	useEffect(() => {
		async function fetchSavedJobs() {
			try {
				const response = await fetch(
					`/api/jobs/saved?gmail=${encodeURIComponent(authInfo.gmail)}`,
				);

				const data = await response.json();
				if (!response.ok) {
					throw new Error(data.error || 'Failed to fetch saved jobs');
				}

				// Sort jobs by status priority and suitability score
				const sortedJobs = data.jobs.sort((a: ISavedJob, b: ISavedJob) => {
					const statusPriority: Record<ApplicationStatus, number> = {
						[ApplicationStatus.WANT_TO_APPLY]: 3,
						[ApplicationStatus.PENDING_APPLICATION]: 2,
						[ApplicationStatus.APPLIED]: 1,
						[ApplicationStatus.DISCARDED]: 0,
					};

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
		}

		fetchSavedJobs();
	}, []);

	return (
		<div className="bg-slate-950 text-white min-h-screen">
			<div className="background-glows fixed inset-0 z-0"></div>
			<main className="relative z-10 max-w-7xl mx-auto pt-32 pb-24 px-4">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
					<p className="text-slate-400">
						Manage your job search and track your applications
					</p>
				</div>

				{/* Auth Info Section */}
				<div className="mb-8 p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
					<div className="flex justify-between items-center">
						<div>
							<h2 className="text-lg font-medium text-slate-200">
								Current Session
							</h2>
							<p className="text-purple-400 font-medium mt-1">
								{authInfo.gmail}
							</p>
						</div>
						<div className="flex gap-3">
							<a
								href="/profile"
								className="px-4 py-2 text-sm font-medium bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
							>
								Edit Profile
							</a>
							<button
								onClick={() => {
									const requestBody = {
										credentials: authInfo,
										companyIds: selectedCompanies,
										cvUrl: DEFAULT_CANDIDATE_DATA.cvUrl,
										candidateInfo: DEFAULT_CANDIDATE_DATA.candidateInfo,
									};
									setSearchRequestBody(requestBody);
									setSearchModalOpen(true);
								}}
								className={primaryButtonClasses}
							>
								Start Search
							</button>
						</div>
					</div>
				</div>

				{/* Search Modal */}
				<SearchModal
					isOpen={isSearchModalOpen}
					onClose={() => setSearchModalOpen(false)}
					requestBody={searchRequestBody}
				/>

				{/* Main Content - Two Column Layout */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Left Column - Companies */}
					<div className="space-y-6">
						<div className={cardClasses}>
							<h3 className="text-lg font-bold text-white mb-4">
								Target Companies
							</h3>
							<CompanySelector
								selectedCompanies={selectedCompanies}
								onCompaniesChange={setSelectedCompanies}
							/>
						</div>

						{/* Quick Stats Card */}
						<div className={cardClasses}>
							<h3 className="text-lg font-bold text-white mb-4">Quick Stats</h3>
							<div className="grid grid-cols-2 gap-4">
								<div className="text-center p-3 bg-slate-900/50 rounded-lg">
									<div className="text-2xl font-bold text-purple-400">
										{savedJobs.length}
									</div>
									<div className="text-sm text-slate-400">Total Saved</div>
								</div>
								<div className="text-center p-3 bg-slate-900/50 rounded-lg">
									<div className="text-2xl font-bold text-green-400">
										{
											savedJobs.filter(
												job => job.status === ApplicationStatus.APPLIED,
											).length
										}
									</div>
									<div className="text-sm text-slate-400">Applied</div>
								</div>
								<div className="text-center p-3 bg-slate-900/50 rounded-lg">
									<div className="text-2xl font-bold text-yellow-400">
										{
											savedJobs.filter(
												job => job.status === ApplicationStatus.WANT_TO_APPLY,
											).length
										}
									</div>
									<div className="text-sm text-slate-400">Want to Apply</div>
								</div>
								<div className="text-center p-3 bg-slate-900/50 rounded-lg">
									<div className="text-2xl font-bold text-blue-400">
										{selectedCompanies.length}
									</div>
									<div className="text-sm text-slate-400">Target Companies</div>
								</div>
							</div>
						</div>
					</div>

					{/* Right Column - Saved Jobs */}
					<div className="space-y-6">
						<div className={cardClasses}>
							<div className="flex justify-between items-center mb-4">
								<h3 className="text-lg font-bold text-white">
									Recent Saved Jobs
								</h3>
								<a
									href="/saved-jobs"
									className="text-purple-400 hover:text-purple-300 text-sm"
								>
									View All
								</a>
							</div>
							<div className="min-h-[400px] max-h-[calc(100vh-20rem)] overflow-y-auto pr-2">
								{isLoadingJobs ? (
									<div className="flex items-center justify-center text-slate-400 h-32">
										<p>Loading saved jobs...</p>
									</div>
								) : savedJobs.length === 0 ? (
									<div className="flex flex-col items-center justify-center text-slate-400 h-32">
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
			</main>
		</div>
	);
}
