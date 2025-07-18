import {JobMatchingOrchestrator} from './jobMatchingOrchestrator';
import {ICompany} from '@/models/Company';
import {CompanyService} from './companyService';

export class JobService {
	static async searchJobs(data: Record<string, any>) {
		const {companyIds, cvUrl, candidateInfo, userId} = data;
		if (!Array.isArray(companyIds) || !cvUrl || !candidateInfo || !userId) {
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
		const resultsMap = await orchestrator.orchestrateBatchJobMatching(
			companies,
			cvUrl,
			candidateInfo,
			userId,
		);

		const results = companyIds.map((id: string) => ({
			companyId: id,
			processed: resultsMap.has(id),
			results: resultsMap.get(id) || [],
		}));
		return {results};
	}
}
