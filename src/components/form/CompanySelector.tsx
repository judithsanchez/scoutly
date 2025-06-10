'use client';

interface CompanySelectorProps {
	selectedCompanies: string[];
	onCompaniesChange: (companies: string[]) => void;
}

export function CompanySelector({
	selectedCompanies,
	onCompaniesChange,
}: CompanySelectorProps) {
	// For now, we'll use a hardcoded list of companies
	const availableCompanies = ['Booking', 'Adyen', 'Mollie', 'WeTransfer'];

	const handleCompanyChange = (company: string) => {
		if (selectedCompanies.includes(company)) {
			onCompaniesChange(selectedCompanies.filter(c => c !== company));
		} else {
			onCompaniesChange([...selectedCompanies, company]);
		}
	};

	return (
		<div className="space-y-3">
			<label className="block text-sm font-medium text-slate-300">
				Select Target Companies
			</label>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				{availableCompanies.map(company => (
					<button
						key={company}
						type="button"
						onClick={() => handleCompanyChange(company)}
						className={`p-3 rounded-lg text-sm font-medium transition-colors ${
							selectedCompanies.includes(company)
								? 'bg-purple-600 text-white hover:bg-purple-700'
								: 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
						}`}
					>
						{company}
					</button>
				))}
			</div>
		</div>
	);
}
