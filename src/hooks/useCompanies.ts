import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {ICompany, CreateCompanyInput} from '@/types/company';
import apiClient from '@/lib/apiClient';
import {endpoint} from '@/constants/apiEndpoints';
import {useAuth} from '@/contexts/AuthContext';

export interface TrackedCompany {
	_id: string;
	id: string;
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

// Extend ICompany to include id for API responses
export interface ICompanyWithId extends ICompany {
	id: string;
}

async function fetchCompanies(): Promise<ICompanyWithId[]> {
	// Ensure the return type is ICompanyWithId[]
	return apiClient(endpoint.companies.list) as Promise<ICompanyWithId[]>;
}

async function fetchTrackedCompanies(email: string): Promise<TrackedCompany[]> {
	if (!email) throw new Error('User not authenticated');
	const data: TrackedCompaniesResponse = await apiClient(
		`${endpoint.user_company_preferences.list}?email=${encodeURIComponent(
			email,
		)}`,
	);
	return data.companies;
}

async function trackCompany({
	email,
	id,
	rank,
}: {
	email: string;
	id: string;
	rank?: number;
}) {
	if (!email) throw new Error('User not authenticated');
	return apiClient(endpoint.user_company_preferences.list, {
		method: 'POST',
		body: JSON.stringify({email, companyId: id, rank, isTracking: true}),
	});
}

async function untrackCompany({email, id}: {email: string; id: string}) {
	if (!email) throw new Error('User not authenticated');
	return apiClient(endpoint.user_company_preferences.list, {
		method: 'DELETE',
		body: JSON.stringify({email, companyId: id}),
	});
}

async function updateRanking({
	email,
	id,
	rank,
}: {
	email: string;
	id: string;
	rank: number;
}) {
	if (!email) throw new Error('User not authenticated');
	return apiClient(endpoint.user_company_preferences.list, {
		method: 'PATCH',
		body: JSON.stringify({email, companyId: id, rank}),
	});
}

async function createCompany(companyData: CreateCompanyInput) {
	return apiClient(endpoint.companies.create, {
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

	const companiesQuery = useQuery<ICompanyWithId[], Error>({
		queryKey: ['companies'],
		queryFn: fetchCompanies,
		retry: (failureCount: number, error: Error) => {
			if (error instanceof Error) {
				if (error.message.includes('Database connection error')) {
					return false;
				}
			}
			return failureCount < 3;
		},
		retryDelay: (attemptIndex: number) =>
			Math.min(1000 * 2 ** attemptIndex, 30000),
		staleTime: 1000 * 60 * 5,
		gcTime: 1000 * 60 * 30,
	});

	const trackedCompaniesQuery = useQuery<TrackedCompany[], Error>({
		queryKey: ['trackedCompanies', getEmail()],
		queryFn: () => fetchTrackedCompanies(getEmail()),
		enabled: !!getEmail(),
		retry: (failureCount: number, error: Error) => {
			if (error instanceof Error) {
				if (error.message.includes('Database connection error')) {
					return false;
				}
			}
			return failureCount < 3;
		},
		retryDelay: (attemptIndex: number) =>
			Math.min(1000 * 2 ** attemptIndex, 30000),
		staleTime: 1000 * 60 * 5,
		gcTime: 1000 * 60 * 30,
	});

	const trackMutation = useMutation({
		mutationFn: ({id, rank}: {id: string; rank?: number}) =>
			trackCompany({email: getEmail(), id, rank}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['trackedCompanies', getEmail()],
			});
		},
	});

	const untrackMutation = useMutation({
		mutationFn: ({id}: {id: string}) => untrackCompany({email: getEmail(), id}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['trackedCompanies', getEmail()],
			});
		},
	});

	const updateRankingMutation = useMutation({
		mutationFn: ({id, rank}: {id: string; rank: number}) =>
			updateRanking({email: getEmail(), id, rank}),
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
		companies: companiesQuery.data || ([] as ICompanyWithId[]),
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
		trackCompany: (id: string, rank?: number) =>
			trackMutation.mutate({id, rank}),
		untrackCompany: (id: string) => untrackMutation.mutate({id}),
		updateRanking: (id: string, rank: number) =>
			updateRankingMutation.mutate({id, rank}),
		createCompany: (companyData: any) =>
			createCompanyMutation.mutateAsync(companyData),
		isCreatingCompany: createCompanyMutation.isPending,
	};
}
