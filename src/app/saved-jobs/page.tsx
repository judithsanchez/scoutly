'use client';

import {useEffect, useState} from 'react';
import SavedJobCard from '@/components/SavedJobCard';
import {ISavedJob} from '@/types/savedJob';

const HARDCODED_EMAIL = 'judithv.sanchezc@gmail.com';

export default function SavedJobsPage() {
	interface SavedJobResponse {
		jobs: ISavedJob[];
		total: number;
	}

	const [jobs, setJobs] = useState<ISavedJob[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

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
				setJobs(jobs.jobs);
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
							<SavedJobCard key={job._id} job={job} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}
