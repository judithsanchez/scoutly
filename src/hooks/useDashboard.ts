import {useState, useCallback} from 'react';
import apiClient from '@/lib/apiClient';
import {endpoint} from '@/constants/apiEndpoints';
import {ApplicationStatus, ISavedJob, statusPriority} from '@/types/savedJob';

export function useDashboard() {
	const [savedJobs, setSavedJobs] = useState<ISavedJob[]>([]);
	const [isLoadingJobs, setIsLoadingJobs] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchSavedJobs = useCallback(async () => {
		setIsLoadingJobs(true);
		setError(null);
		try {
			const data = await apiClient<{jobs: ISavedJob[]}>(endpoint.jobs.saved);
			const sortedJobs = data.jobs.sort((a, b) => {
				const statusDiff =
					statusPriority[a.status as ApplicationStatus] -
					statusPriority[b.status as ApplicationStatus];
				if (statusDiff !== 0) return -statusDiff;
				return b.suitabilityScore - a.suitabilityScore;
			});
			setSavedJobs(sortedJobs);
		} catch (err: any) {
			setError(err?.message || 'Failed to fetch saved jobs');
		} finally {
			setIsLoadingJobs(false);
		}
	}, []);

	const updateJobStatus = useCallback(
		async (jobId: string, status: ApplicationStatus) => {
			try {
				const url = `${endpoint.jobs.saved}?id=${encodeURIComponent(jobId)}`;
				const data = await apiClient<{job: ISavedJob}>(url, {
					method: 'PATCH',
					body: JSON.stringify({status}),
				});
				const updatedJob = data.job;
				setSavedJobs((currentJobs: ISavedJob[]) => {
					const updatedJobs = currentJobs.map((job: ISavedJob) =>
						job._id === jobId ? {...job, ...updatedJob} : job,
					);
					return updatedJobs.sort((a: ISavedJob, b: ISavedJob) => {
						const statusDiff =
							statusPriority[a.status as ApplicationStatus] -
							statusPriority[b.status as ApplicationStatus];
						if (statusDiff !== 0) return -statusDiff;
						return b.suitabilityScore - a.suitabilityScore;
					});
				});
				return true;
			} catch (err: any) {
				setError(err?.message || 'Failed to update job status');
				return false;
			}
		},
		[],
	);

	return {
		savedJobs,
		isLoadingJobs,
		error,
		fetchSavedJobs,
		updateJobStatus,
		setSavedJobs,
	};
}
