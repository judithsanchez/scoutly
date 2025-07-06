'use client';

import {useEffect, useState, useMemo} from 'react';
import {useAuth} from '@/contexts/AuthContext';
import SavedJobCard from '@/components/SavedJobCard';
import {ISavedJob, ApplicationStatus, statusPriority} from '@/types/savedJob';
import apiClient from '@/lib/apiClient'; // Import the new apiClient
import {createLogger} from '@/utils/frontendLogger';
import {
	HEADING_LG,
	FLEX_COL,
	PAGE_BACKGROUND_CONTAINER,
	PAGE_BACKGROUND_GLOW,
	PAGE_CONTENT_CONTAINER,
} from '@/constants/styles';

export default function SavedJobsPage() {
	const {user, isLoading: authLoading, isAuthenticated} = useAuth();

	interface SavedJobResponse {
		jobs: ISavedJob[];
		total: number;
	}

	const [jobs, setJobs] = useState<ISavedJob[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Use useMemo to prevent logger recreation on every render
	const logger = useMemo(
		() => createLogger('SavedJobsPage', user?.email || 'unknown'),
		[user?.email],
	);

	const handleStatusChange = async (
		jobId: string,
		status: ApplicationStatus,
	) => {
		if (!user?.email) {
			setError('No authenticated user. Please sign in.');
			return;
		}
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
			logger.error('Failed to update job status', {error: err, jobId, status});
		}
	};

	useEffect(() => {
		async function fetchSavedJobs() {
			if (!user?.email) {
				setError('No authenticated user. Please sign in.');
				setIsLoading(false);
				return;
			}
			try {
				logger.info('Fetching saved jobs', {email: user.email});
				const data = await apiClient<SavedJobResponse>(
					`jobs/saved?email=${encodeURIComponent(user.email)}`,
				);
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
				logger.error('Failed to fetch saved jobs', {error: err});
			} finally {
				setIsLoading(false);
			}
		}

		if (isAuthenticated) {
			fetchSavedJobs();
		}

		if (!authLoading && !isAuthenticated) {
			setError('Please sign in to view your saved jobs.');
			setIsLoading(false);
		}
	}, [user, isAuthenticated, authLoading, logger]);

	if (isLoading || authLoading) {
		return (
			<div className={PAGE_BACKGROUND_CONTAINER}>
				<div className={PAGE_BACKGROUND_GLOW}></div>
				<main className={PAGE_CONTENT_CONTAINER}>
					<div className="text-slate-400">Loading authentication...</div>
				</main>
			</div>
		);
	}

	if (!isAuthenticated || !user?.email) {
		return (
			<div className={PAGE_BACKGROUND_CONTAINER}>
				<div className={PAGE_BACKGROUND_GLOW}></div>
				<main className={PAGE_CONTENT_CONTAINER}>
					<div className="text-red-400">
						Please sign in to view your saved jobs.
					</div>
				</main>
			</div>
		);
	}

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
