import {useQuery} from '@tanstack/react-query';
import {ICompany} from '@/models/Company';

async function fetchCompanies(): Promise<ICompany[]> {
	const response = await fetch('/api/companies');
	if (!response.ok) {
		throw new Error('Failed to fetch companies');
	}
	return response.json();
}

export function useCompanies() {
	return useQuery({
		queryKey: ['companies'],
		queryFn: fetchCompanies,
	});
}
