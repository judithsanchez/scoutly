import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {ICompany} from '@/models/Company';

interface TrackedCompaniesResponse {
	companies: Array<{
		companyID: string;
		ranking: number;
	}>;
}

async function fetchCompanies() {
	const response = await fetch('/api/companies');
	if (!response.ok) {
		throw new Error('Failed to fetch companies');
	}
	return response.json();
}

async function fetchTrackedCompanies(): Promise<
	Array<{companyID: string; ranking: number}>
> {
	const response = await fetch('/api/users/tracked-companies');
	if (!response.ok) {
		throw new Error('Failed to fetch tracked companies');
	}
	const data: TrackedCompaniesResponse = await response.json();
	return data.companies;
}

async function trackCompany(
	companyIdOrParams: string | {companyId: string; ranking?: number},
) {
	let companyId: string;
	let ranking: number = 75;

	// Handle both parameter styles
	if (typeof companyIdOrParams === 'string') {
		companyId = companyIdOrParams;
	} else {
		companyId = companyIdOrParams.companyId;
		ranking = companyIdOrParams.ranking ?? 75;
	}

	const response = await fetch('/api/users/tracked-companies', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({companyId, ranking}),
	});
	if (!response.ok) {
		throw new Error('Failed to track company');
	}
	return response.json();
}

async function untrackCompany(companyId: string) {
	const response = await fetch(`/api/users/tracked-companies/${companyId}`, {
		method: 'DELETE',
	});
	if (!response.ok) {
		throw new Error('Failed to untrack company');
	}
	return response.json();
}

export function useCompanies() {
	const queryClient = useQueryClient();

	const companiesQuery = useQuery<ICompany[], Error>({
		queryKey: ['companies'],
		queryFn: fetchCompanies,
		retry: (failureCount, error) => {
			// Don't retry on specific error messages that indicate permanent failures
			if (error instanceof Error) {
				if (error.message.includes('Database connection error')) {
					return false;
				}
			}
			return failureCount < 3;
		},
		retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
		staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
		gcTime: 1000 * 60 * 30, // Keep data in cache for 30 minutes
	});

	const trackedCompaniesQuery = useQuery<
		Array<{companyID: string; ranking: number}>,
		Error
	>({
		queryKey: ['trackedCompanies'],
		queryFn: fetchTrackedCompanies,
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
			queryClient.invalidateQueries({queryKey: ['trackedCompanies']});
		},
	});

	const untrackMutation = useMutation({
		mutationFn: untrackCompany,
		onSuccess: () => {
			queryClient.invalidateQueries({queryKey: ['trackedCompanies']});
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
		trackCompany: (companyId: string, ranking?: number) =>
			trackMutation.mutate({companyId, ranking}),
		untrackCompany: untrackMutation.mutate,
	};
}
