'use client';

import {useEffect, useState} from 'react';
import SavedJobCard from '@/components/SavedJobCard';
import {ISavedJob, ApplicationStatus, statusPriority} from '@/types/savedJob';
import {DEFAULT_USER_EMAIL} from '@/constants/common';
import {API_ENDPOINTS} from '@/constants/config';
import {API_CONFIG, API_ERRORS} from '@/constants/api';
import {
	HEADING_LG,
	FLEX_COL,
	PAGE_BACKGROUND_CONTAINER,
	PAGE_BACKGROUND_GLOW,
	PAGE_CONTENT_CONTAINER,
} from '@/constants/styles';

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
			if (!DEFAULT_USER_EMAIL) {
				setError(
					'No user email configured. Please set NEXT_PUBLIC_DEV_USER_EMAIL in your .env.local file',
				);
				return;
			}

			const response = await fetch(API_ENDPOINTS.SAVED_JOB_STATUS, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					jobId,
					status,
					gmail: DEFAULT_USER_EMAIL,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to update job status');
			}

			const updatedJob = await response.json();

			setJobs(currentJobs => {
				const updatedJobs = currentJobs.map(job =>
					job._id === jobId ? {...job, ...updatedJob} : job,
				);

				return updatedJobs.sort((a, b) => {
					const statusDiff =
						statusPriority[a.status as ApplicationStatus] -
						statusPriority[b.status as ApplicationStatus];
					if (statusDiff !== 0) return -statusDiff;

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
				if (!DEFAULT_USER_EMAIL) {
					setError(
						'No user email configured. Please set NEXT_PUBLIC_DEV_USER_EMAIL in your .env.local file',
					);
					setIsLoading(false);
					return;
				}

				console.log('Fetching jobs for email:', DEFAULT_USER_EMAIL);
				const response = await fetch(
					`${API_ENDPOINTS.SAVED_JOBS}?${
						API_CONFIG.QUERY_PARAMS.EMAIL
					}=${encodeURIComponent(DEFAULT_USER_EMAIL)}`,
				);

				const data = await response.json();
				if (!response.ok) {
					throw new Error(data.error || API_ERRORS.NOT_FOUND);
				}

				const jobs = data as SavedJobResponse;
				console.log('Fetched jobs:', jobs);

				const sortedJobs = jobs.jobs.sort((a, b) => {
					const statusDiff =
						statusPriority[a.status as ApplicationStatus] -
						statusPriority[b.status as ApplicationStatus];
					if (statusDiff !== 0) return -statusDiff;

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
		<div className={PAGE_BACKGROUND_CONTAINER}>
			<div className={PAGE_BACKGROUND_GLOW}></div>
			<main className={PAGE_CONTENT_CONTAINER}>
				<h1 className={HEADING_LG}>Saved Jobs</h1>

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
					<div className={`space-y-6 ${FLEX_COL}`}>
						{jobs.map(job => (
							<SavedJobCard
								key={job._id}
								job={job}
								onStatusChange={handleStatusChange}
							/>
						))}
					</div>
				)}
			</main>
		</div>
	);
}
