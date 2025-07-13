import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {ICompany, CreateCompanyInput} from '@/types/company';
import apiClient from '@/lib/apiClient';
import {endpoint} from '@/constants/apiEndpoints';
import {useAuth} from '@/contexts/AuthContext';

// This matches the 'joined' shape returned by the backend
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
		lastUpdated: string; // ISO string from backend
	};
}

interface TrackedCompaniesResponse {
	companies: any[]; // flat shape, not used in frontend
	joined: TrackedCompany[];
}

// Extend ICompany to include id for API responses
export interface ICompanyWithId extends ICompany {
	id: string;
}

async function fetchCompanies(): Promise<ICompanyWithId[]> {
	// Ensure the return type is ICompanyWithId[]
	return apiClient(endpoint.companies.list) as Promise<ICompanyWithId[]>;
}

async function fetchTrackedCompanies(
	userId: string,
): Promise<TrackedCompany[]> {
	if (!userId) throw new Error('User not authenticated');
	const data: TrackedCompaniesResponse = await apiClient(
		`${endpoint.user_company_preferences.list}?userId=${encodeURIComponent(
			userId,
		)}`,
	);
	// Use the 'joined' array for tracked companies
	return data.joined || [];
}

async function trackCompany({
	userId,
	id,
	rank,
}: {
	userId: string;
	id: string;
	rank?: number;
}) {
	if (!userId) throw new Error('User not authenticated');
	return apiClient(endpoint.user_company_preferences.list, {
		method: 'POST',
		body: JSON.stringify({userId, companyId: id, rank, isTracking: true}),
	});
}

async function untrackCompany({userId, id}: {userId: string; id: string}) {
	if (!userId) throw new Error('User not authenticated');
	return apiClient(
		endpoint.user_company_preferences.by_company_id.replace('[companyId]', id),
		{
			method: 'DELETE',
			body: JSON.stringify({userId}),
		},
	);
}

async function updateRanking({
	userId,
	id,
	rank,
}: {
	userId: string;
	id: string;
	rank: number;
}) {
	if (!userId) throw new Error('User not authenticated');
	return apiClient(
		endpoint.user_company_preferences.by_company_id.replace('[companyId]', id),
		{
			method: 'PUT',
			body: JSON.stringify({userId, rank}),
		},
	);
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

	function getUserId() {
		return user?.userId || '';
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
		queryKey: ['trackedCompanies', getUserId()],
		queryFn: () => fetchTrackedCompanies(getUserId()),
		enabled: !!getUserId(),
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
			trackCompany({userId: getUserId(), id, rank}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['trackedCompanies', getUserId()],
			});
		},
	});

	const untrackMutation = useMutation({
		mutationFn: ({id}: {id: string}) =>
			untrackCompany({userId: getUserId(), id}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['trackedCompanies', getUserId()],
			});
		},
	});

	const updateRankingMutation = useMutation({
		mutationFn: ({id, rank}: {id: string; rank: number}) =>
			updateRanking({userId: getUserId(), id, rank}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['trackedCompanies', getUserId()],
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
		trackedCompanies: trackedCompaniesQuery.data || [], // now joined shape
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
