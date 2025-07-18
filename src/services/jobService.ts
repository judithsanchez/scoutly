import {JobMatchingOrchestrator} from './jobMatchingOrchestrator';
import {ICompany} from '@/models/Company';
import {CompanyService} from './companyService';

export class JobService {
	static async searchJobs(data: Record<string, any>) {
		const {companyIds, cvUrl, candidateInfo} = data;
		if (!Array.isArray(companyIds) || !cvUrl || !candidateInfo) {
			throw new Error('Missing required job search input');
		}

		const companies: ICompany[] = await Promise.all(
			companyIds.map(async (id: string) => {
				const company = await CompanyService.getCompanyById(id);
				if (!company) throw new Error(`Company not found: ${id}`);
				return company;
			}),
		);

		const orchestrator = new JobMatchingOrchestrator();
		const userEmail = data.userEmail || '';
		const resultsMap = await orchestrator.orchestrateBatchJobMatching(
			companies,
			cvUrl,
			candidateInfo,
			userEmail,
		);

		const results = companyIds.map((id: string) => ({
			companyId: id,
			processed: resultsMap.has(id),
			results: resultsMap.get(id) || [],
		}));
		return {results};
	}
}
