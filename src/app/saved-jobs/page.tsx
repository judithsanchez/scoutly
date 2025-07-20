'use client';

import {useEffect, useState, useMemo} from 'react';
import SavedJobCard from '@/components/SavedJobCard';
import {ISavedJob, ApplicationStatus, statusPriority} from '@/types/savedJob';
import apiClient from '@/lib/apiClient';
import styles from './SavedJobsPage.module.css';

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
			const url = `/api/jobs/saved?id=${encodeURIComponent(jobId)}`;
			const response = await fetch(url, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({status}),
			});
			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to update job status');
			}
			const {job: updatedJob} = await response.json();

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
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to update job status';
			setError(errorMessage);
			console.log('Failed to update job status', {error: err, jobId, status});
		}
	};

	const handleDeleted = (jobId: string) => {
		setJobs(currentJobs => currentJobs.filter(job => job._id !== jobId));
	};

	useEffect(() => {
		async function fetchSavedJobs() {
			try {
				console.log('Fetching saved jobs');
				const data = await apiClient<SavedJobResponse>(`/api/jobs/saved`);
				const sortedJobs = data.jobs.sort((a, b) => {
					const statusDiff =
						statusPriority[a.status as ApplicationStatus] -
						statusPriority[b.status as ApplicationStatus];
					if (statusDiff !== 0) return -statusDiff; // Higher priority first

					// Then sort by suitability score
					return b.suitabilityScore - a.suitabilityScore;
				});

				setJobs(sortedJobs);
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'An unknown error occurred';
				setError(errorMessage);
				console.log('Failed to fetch saved jobs', {error: err});
			} finally {
				setIsLoading(false);
			}
		}

		fetchSavedJobs();
	}, []);

	if (isLoading) {
		return (
			<div className="page-background-container">
				<main className="page-content-container">
					<div className={styles.loadingText}>Loading saved jobs...</div>
				</main>
			</div>
		);
	}

	return (
		<div className="page-background-container">
			<main className="page-content-container">
				<h1 className="heading-lg">Saved Jobs</h1>

				{isLoading ? (
					<div className={styles.loadingText}>Loading saved jobs...</div>
				) : error ? (
					<div className={styles.errorText}>{error}</div>
				) : jobs.length === 0 ? (
					<div className={styles.emptyText}>
						You haven&rsquo;t saved any jobs yet. When you find interesting
						opportunities, save them here to keep track of them.
					</div>
				) : (
					<div className={styles.jobsList}>
						{jobs.map(job => (
							<SavedJobCard
								key={job._id}
								job={job}
								onStatusChange={handleStatusChange}
								onDeleted={handleDeleted}
							/>
						))}
					</div>
				)}
			</main>
		</div>
	);
}
