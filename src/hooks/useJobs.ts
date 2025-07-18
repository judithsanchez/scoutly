import apiClient from '@/lib/apiClient';
import {endpoint} from '@/constants/apiEndpoints';

export interface JobSearchResponse {
	results: Array<{
		processed: boolean;
		results: any[];
	}>;
}

export async function searchJobs(requestBody: any): Promise<JobSearchResponse> {
	return apiClient(endpoint.jobs.search, {
		method: 'POST',
		body: JSON.stringify(requestBody),
	});
}

export function useJobs() {
	return {searchJobs};
}
