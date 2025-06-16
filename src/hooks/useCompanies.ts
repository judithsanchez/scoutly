import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {ICompany} from '@/models/Company';

interface TrackedCompaniesResponse {
	companies: string[];
}

async function fetchCompanies() {
	const response = await fetch('/api/companies');
	if (!response.ok) {
		throw new Error('Failed to fetch companies');
	}
	return response.json();
}

async function fetchTrackedCompanies(): Promise<string[]> {
	const response = await fetch('/api/users/tracked-companies');
	if (!response.ok) {
		throw new Error('Failed to fetch tracked companies');
	}
	const data: TrackedCompaniesResponse = await response.json();
	return data.companies;
}

async function trackCompany(companyId: string) {
	const response = await fetch('/api/users/tracked-companies', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({companyId}),
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

	const companiesQuery = useQuery({
		queryKey: ['companies'],
		queryFn: fetchCompanies,
	});

	const trackedCompaniesQuery = useQuery({
		queryKey: ['trackedCompanies'],
		queryFn: fetchTrackedCompanies,
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
		companies: companiesQuery.data || [],
		trackedCompanies: trackedCompaniesQuery.data || [],
		isLoading: companiesQuery.isLoading || trackedCompaniesQuery.isLoading,
		isError: companiesQuery.isError || trackedCompaniesQuery.isError,
		trackCompany: trackMutation.mutate,
		untrackCompany: untrackMutation.mutate,
	};
}
