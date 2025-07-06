import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {ICompany, CreateCompanyInput} from '@/types/company';
import {useSession} from 'next-auth/react';

// Use NextAuth session for user email
function getCurrentUserEmail(): string {
	if (typeof window === 'undefined') return '';
	// Use NextAuth's session if available
	try {
		// This will only work inside a React component/hook
		// so we will fallback to window if not in React context
		// (for SSR, this will be empty string)
		// The correct way is to pass the email as a prop from the component using the hook
		// but for now, we try to get it from window.__NEXTAUTH_SESSION
		// (You may want to refactor to pass email as a prop)
		// @ts-ignore
		if (window.__NEXTAUTH_SESSION && window.__NEXTAUTH_SESSION.user?.email) {
			// @ts-ignore
			return window.__NEXTAUTH_SESSION.user.email;
		}
		// fallback: try to get from localStorage/sessionStorage if you store it there
		return '';
	} catch {
		return '';
	}
}

interface TrackedCompany {
	_id: string;
	companyID: string;
	company: string;
	careers_url: string;
	logo_url?: string;
	userPreference: {
		rank: number;
		isTracking: boolean;
		frequency: string;
		lastUpdated: Date;
	};
}

interface TrackedCompaniesResponse {
	companies: TrackedCompany[];
}

async function fetchCompanies() {
	const response = await fetch('/api/companies');
	if (!response.ok) {
		throw new Error('Failed to fetch companies');
	}
	return response.json();
}

// NOTE: Update this if tracked companies are now fetched via /api/users/query
async function fetchTrackedCompanies(): Promise<TrackedCompany[]> {
	const email = getCurrentUserEmail();
	if (!email) throw new Error('User not authenticated');
	const response = await fetch(
		'/api/user-company-preferences?email=' + encodeURIComponent(email),
	);
	if (!response.ok) {
		throw new Error('Failed to fetch tracked companies');
	}
	const data: TrackedCompaniesResponse = await response.json();
	return data.companies;
}

async function trackCompany(
	companyIdOrParams: string | {companyId: string; rank?: number},
) {
	const email = getCurrentUserEmail();
	if (!email) throw new Error('User not authenticated');
	let companyId: string;
	let rank: number = 75;

	if (typeof companyIdOrParams === 'string') {
		companyId = companyIdOrParams;
	} else {
		companyId = companyIdOrParams.companyId;
		rank = companyIdOrParams.rank ?? 75;
	}

	const response = await fetch('/api/user-company-preferences', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({email, companyId, rank, isTracking: true}),
	});
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || 'Failed to track company');
	}
	return response.json();
}

async function untrackCompany(companyId: string) {
	const email = getCurrentUserEmail();
	if (!email) throw new Error('User not authenticated');
	const response = await fetch('/api/user-company-preferences', {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({email, companyId}),
	});
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || 'Failed to untrack company');
	}
	return response.json();
}

async function updateRanking(params: {companyId: string; rank: number}) {
	const email = getCurrentUserEmail();
	if (!email) throw new Error('User not authenticated');
	const {companyId, rank} = params;
	const response = await fetch('/api/user-company-preferences', {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({email, companyId, rank}),
	});
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || 'Failed to update company ranking');
	}
	return response.json();
}

async function createCompany(companyData: CreateCompanyInput) {
	const response = await fetch('/api/companies/create', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(companyData),
	});
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || 'Failed to create company');
	}
	return response.json();
}

export function useCompanies() {
	// Use NextAuth session for user email
	const {data: session} = useSession();
	const queryClient = useQueryClient();

	// Patch getCurrentUserEmail to use session if available
	function getEmail() {
		return session?.user?.email || getCurrentUserEmail();
	}

	const companiesQuery = useQuery<ICompany[], Error>({
		queryKey: ['companies'],
		queryFn: fetchCompanies,
		retry: (failureCount, error) => {
			if (error instanceof Error) {
				if (error.message.includes('Database connection error')) {
					return false;
				}
			}
			return failureCount < 3;
		},
		retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
		staleTime: 1000 * 60 * 5,
		gcTime: 1000 * 60 * 30,
	});

	const trackedCompaniesQuery = useQuery<TrackedCompany[], Error>({
		queryKey: ['trackedCompanies', getEmail()],
		queryFn: async () => {
			const email = getEmail();
			if (!email) throw new Error('User not authenticated');
			const response = await fetch(
				'/api/user-company-preferences?email=' + encodeURIComponent(email),
			);
			if (!response.ok) {
				throw new Error('Failed to fetch tracked companies');
			}
			const data: TrackedCompaniesResponse = await response.json();
			return data.companies;
		},
		enabled: !!getEmail(),
		retry: (failureCount, error) => {
			if (error instanceof Error) {
				if (error.message.includes('Database connection error')) {
					return false;
				}
			}
			return failureCount < 3;
		},
		retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
		staleTime: 1000 * 60 * 5,
		gcTime: 1000 * 60 * 30,
	});

	const trackMutation = useMutation({
		mutationFn: trackCompany,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['trackedCompanies', getEmail()],
			});
		},
	});

	const untrackMutation = useMutation({
		mutationFn: untrackCompany,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['trackedCompanies', getEmail()],
			});
		},
	});

	const updateRankingMutation = useMutation({
		mutationFn: updateRanking,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['trackedCompanies', getEmail()],
			});
		},
	});

	const createCompanyMutation = useMutation({
		mutationFn: createCompany,
		onSuccess: () => {
			queryClient.invalidateQueries({queryKey: ['companies']});
		},
	});

	return {
		companies: companiesQuery.data || ([] as ICompany[]),
		trackedCompanies: trackedCompaniesQuery.data || [],
		isLoading: companiesQuery.isLoading || trackedCompaniesQuery.isLoading,
		isError: companiesQuery.isError || trackedCompaniesQuery.isError,
		error: companiesQuery.error || trackedCompaniesQuery.error,
		isRefetching:
			companiesQuery.isRefetching || trackedCompaniesQuery.isRefetching,
		refetch: () => {
			companiesQuery.refetch();
			trackedCompaniesQuery.refetch();
		},
		trackCompany: (companyId: string, rank?: number) =>
			trackMutation.mutate({companyId, rank}),
		untrackCompany: untrackMutation.mutate,
		updateRanking: (companyId: string, rank: number) =>
			updateRankingMutation.mutate({companyId, rank}),
		createCompany: (companyData: any) =>
			createCompanyMutation.mutateAsync(companyData),
		isCreatingCompany: createCompanyMutation.isPending,
	};
}
