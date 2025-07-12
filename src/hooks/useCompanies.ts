import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {ICompany, CreateCompanyInput} from '@/types/company';
import apiClient from '@/lib/apiClient';
import {useAuth} from '@/contexts/AuthContext';

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
	return apiClient('/api/companies');
}

async function fetchTrackedCompanies(email: string): Promise<TrackedCompany[]> {
	if (!email) throw new Error('User not authenticated');
	const data: TrackedCompaniesResponse = await apiClient(
		`/api/user-company-preferences?email=${encodeURIComponent(email)}`,
	);
	return data.companies;
}

async function trackCompany({
	email,
	companyId,
	rank,
}: {
	email: string;
	companyId: string;
	rank?: number;
}) {
	if (!email) throw new Error('User not authenticated');
	return apiClient('/api/user-company-preferences', {
		method: 'POST',
		body: JSON.stringify({email, companyId, rank, isTracking: true}),
	});
}

async function untrackCompany({
	email,
	companyId,
}: {
	email: string;
	companyId: string;
}) {
	if (!email) throw new Error('User not authenticated');
	return apiClient('/api/user-company-preferences', {
		method: 'DELETE',
		body: JSON.stringify({email, companyId}),
	});
}

async function updateRanking({
	email,
	companyId,
	rank,
}: {
	email: string;
	companyId: string;
	rank: number;
}) {
	if (!email) throw new Error('User not authenticated');
	return apiClient('/api/user-company-preferences', {
		method: 'PATCH',
		body: JSON.stringify({email, companyId, rank}),
	});
}

async function createCompany(companyData: CreateCompanyInput) {
	return apiClient('/api/companies/create', {
		method: 'POST',
		body: JSON.stringify(companyData),
	});
}

export function useCompanies() {
	const queryClient = useQueryClient();
	const {user} = useAuth();

	function getEmail() {
		return user?.email || '';
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
		queryFn: () => fetchTrackedCompanies(getEmail()),
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
		mutationFn: ({companyId, rank}: {companyId: string; rank?: number}) =>
			trackCompany({email: getEmail(), companyId, rank}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['trackedCompanies', getEmail()],
			});
		},
	});

	const untrackMutation = useMutation({
		mutationFn: ({companyId}: {companyId: string}) =>
			untrackCompany({email: getEmail(), companyId}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['trackedCompanies', getEmail()],
			});
		},
	});

	const updateRankingMutation = useMutation({
		mutationFn: ({companyId, rank}: {companyId: string; rank: number}) =>
			updateRanking({email: getEmail(), companyId, rank}),
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
		untrackCompany: (companyId: string) => untrackMutation.mutate({companyId}),
		updateRanking: (companyId: string, rank: number) =>
			updateRankingMutation.mutate({companyId, rank}),
		createCompany: (companyData: any) =>
			createCompanyMutation.mutateAsync(companyData),
		isCreatingCompany: createCompanyMutation.isPending,
	};
}
