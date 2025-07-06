import {useSession} from 'next-auth/react';
import {useCallback, useState} from 'react';

interface JobMatchingResult {
	company: string;
	processed: boolean;
	results: any[];
	error?: string;
}

interface UseJobMatchingOptions {
	cvUrl: string;
}

export function useJobMatching({cvUrl}: UseJobMatchingOptions) {
	const {data: session} = useSession();
	const [loading, setLoading] = useState(false);
	const [results, setResults] = useState<JobMatchingResult[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	const runJobMatching = useCallback(async () => {
		setLoading(true);
		setError(null);
		setResults(null);

		try {
			// 1. Get user email from session
			const email = session?.user?.email;
			if (!email) {
				setError('No user session found');
				setLoading(false);
				return;
			}

			// 2. Fetch candidate info (user profile)
			const userRes = await fetch('/api/users/query', {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({email}),
			});
			if (!userRes.ok) {
				setError('Failed to fetch user info');
				setLoading(false);
				return;
			}
			const userData = await userRes.json();
			const candidateInfo = userData?.user || {};

			// 3. Fetch tracked companies
			const prefsRes = await fetch(
				`/api/user-company-preferences?email=${encodeURIComponent(email)}`,
			);
			if (!prefsRes.ok) {
				setError('Failed to fetch tracked companies');
				setLoading(false);
				return;
			}
			const prefsData = await prefsRes.json();
			const companyIds = (prefsData.companies || []).map(
				(c: any) => c.companyID,
			);

			if (!cvUrl) {
				setError('CV URL is required');
				setLoading(false);
				return;
			}
			if (!companyIds.length) {
				setError('No tracked companies found');
				setLoading(false);
				return;
			}

			// 4. POST to /api/jobs
			const jobsRes = await fetch('/api/jobs', {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({
					credentials: {gmail: email},
					companyIds,
					cvUrl,
					candidateInfo,
				}),
			});
			if (!jobsRes.ok) {
				const err = await jobsRes.json();
				setError(err.error || 'Job matching failed');
				setLoading(false);
				return;
			}
			const jobsData = await jobsRes.json();
			setResults(jobsData.results || []);
		} catch (err: any) {
			setError(err.message || 'Unexpected error');
		} finally {
			setLoading(false);
		}
	}, [session, cvUrl]);

	return {runJobMatching, loading, results, error};
}
