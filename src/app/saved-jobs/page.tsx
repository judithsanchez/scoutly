'use client';

import {useEffect, useState} from 'react';
import SavedJobCard from '@/components/SavedJobCard';
import {ISavedJob, ApplicationStatus} from '@/types/savedJob';

const HARDCODED_EMAIL = 'judithv.sanchezc@gmail.com';

export default function SavedJobsPage() {
	interface SavedJobResponse {
		jobs: ISavedJob[];
		total: number;
	}

	const [jobs, setJobs] = useState<ISavedJob[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

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
					gmail: HARDCODED_EMAIL,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to update job status');
			}

			const updatedJob = await response.json();

			// Update jobs list with new status and resort
			setJobs(currentJobs => {
				const updatedJobs = currentJobs.map(job =>
					job._id === jobId ? {...job, ...updatedJob} : job,
				);

				// Sort by status priority and suitability score
				return updatedJobs.sort((a, b) => {
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
				console.log('Fetching jobs for email:', HARDCODED_EMAIL);
				const response = await fetch(
					`/api/jobs/saved?gmail=${encodeURIComponent(HARDCODED_EMAIL)}`,
				);

				const data = await response.json();
				if (!response.ok) {
					throw new Error(data.error || 'Failed to fetch saved jobs');
				}

				const jobs = data as SavedJobResponse;
				console.log('Fetched jobs:', jobs);

				// Sort jobs by status priority and suitability score
				const sortedJobs = jobs.jobs.sort((a, b) => {
					// Define status priority (WANT_TO_APPLY highest, DISCARDED lowest)
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

				setJobs(sortedJobs);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'An error occurred');
				console.error('Error fetching jobs:', err);
			} finally {
				setIsLoading(false);
			}
		}

		fetchSavedJobs();
	}, []);

	return (
		<div className="min-h-screen bg-slate-950 text-white pt-32 pb-24 px-4">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-4xl font-extrabold tracking-tight mb-6">
					Saved Jobs
				</h1>

				{isLoading ? (
					<div className="text-slate-400">Loading saved jobs...</div>
				) : error ? (
					<div className="text-red-400">{error}</div>
				) : jobs.length === 0 ? (
					<div className="text-slate-400">
						You haven&apos;t saved any jobs yet. When you find interesting
						opportunities, save them here to keep track of them.
					</div>
				) : (
					<div className="space-y-6">
						{jobs.map(job => (
							<SavedJobCard
								key={job._id}
								job={job}
								onStatusChange={handleStatusChange}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
