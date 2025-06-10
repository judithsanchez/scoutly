'use client';

import {useCompanies} from '@/hooks/useCompanies';

interface CompanySelectorProps {
	selectedCompanies: string[];
	onCompaniesChange: (companies: string[]) => void;
}

export function CompanySelector({
	selectedCompanies,
	onCompaniesChange,
}: CompanySelectorProps) {
	const {data: companies, isLoading, error} = useCompanies();

	if (isLoading) {
		return (
			<div className="space-y-3">
				<label className="block text-sm font-medium text-slate-300">
					Loading companies...
				</label>
				<div className="flex flex-wrap gap-2">
					{[1, 2, 3, 4].map(i => (
						<div
							key={i}
							className="h-10 w-28 bg-slate-700/30 animate-pulse rounded-lg"
						/>
					))}
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="space-y-3">
				<label className="block text-sm font-medium text-red-400">
					Failed to load companies
				</label>
				<p className="text-sm text-slate-400">Please try again later</p>
			</div>
		);
	}

	const handleCompanyChange = (companyId: string) => {
		if (selectedCompanies.includes(companyId)) {
			onCompaniesChange(selectedCompanies.filter(id => id !== companyId));
		} else {
			onCompaniesChange([...selectedCompanies, companyId]);
		}
	};

	return (
		<div className="space-y-3">
			<label className="block text-sm font-medium text-slate-300">
				Select Target Companies
			</label>
			<div className="flex flex-wrap gap-2">
				{companies?.map(company => (
					<button
						key={company.companyID}
						type="button"
						onClick={() => handleCompanyChange(company.companyID)}
						className={`shrink-0 p-3 rounded-lg text-sm font-medium transition-colors ${
							selectedCompanies.includes(company.companyID)
								? 'bg-purple-600 text-white hover:bg-purple-700'
								: 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
						}`}
					>
						{company.company}
					</button>
				))}
			</div>
		</div>
	);
}
