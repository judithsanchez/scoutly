'use client';

import {useCompanies} from '@/hooks/useCompanies';
import {useState} from 'react';

interface CompanySelectorProps {
	selectedCompanies: string[];
	onCompaniesChange: (companies: string[]) => void;
}

export function CompanySelector({
	selectedCompanies,
	onCompaniesChange,
}: CompanySelectorProps) {
	const {companies, isLoading, error} = useCompanies();
	const [searchQuery, setSearchQuery] = useState('');

	const filteredCompanies = companies?.filter(company =>
		company.company.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	if (isLoading) {
		return (
			<div className="space-y-3">
				<label className="block text-sm font-medium text-slate-300">
					Loading companies...
				</label>
				<div className="flex flex-wrap gap-2 justify-center">
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
		<div className="space-y-6">
			<div className="relative">
				<input
					type="text"
					placeholder="Search companies..."
					value={searchQuery}
					onChange={e => setSearchQuery(e.target.value)}
					className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
				/>
				{searchQuery && (
					<button
						onClick={() => setSearchQuery('')}
						className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400"
					>
						✕
					</button>
				)}
			</div>
			{/* Selected Companies Section */}
			{selectedCompanies.length > 0 && (
				<div className="space-y-2">
					<h3 className="text-sm font-medium text-slate-300">
						Selected Companies
					</h3>
					<div className="flex flex-wrap gap-2">
						{filteredCompanies
							?.filter(company => selectedCompanies.includes(company.companyID))
							.map(company => (
								<button
									key={company.companyID}
									type="button"
									onClick={() => handleCompanyChange(company.companyID)}
									className="shrink-0 p-3 rounded-lg text-sm font-medium transition-colors bg-purple-600 text-white hover:bg-purple-700"
								>
									{company.company}
								</button>
							))}
					</div>
				</div>
			)}

			{/* Available Companies Section */}
			<div className="space-y-2">
				<h3 className="text-sm font-medium text-slate-300">
					Available Companies
				</h3>
				<div className="flex flex-wrap gap-2">
					{filteredCompanies
						?.filter(company => !selectedCompanies.includes(company.companyID))
						.map(company => (
							<button
								key={company.companyID}
								type="button"
								onClick={() => handleCompanyChange(company.companyID)}
								className="shrink-0 p-3 rounded-lg text-sm font-medium transition-colors bg-slate-700/50 text-slate-300 hover:bg-slate-700"
							>
								{company.company}
							</button>
						))}
				</div>
			</div>
		</div>
	);
}
