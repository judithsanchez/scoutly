'use client';

import './companies.css';
import {useState} from 'react';
import {useCompanies} from '@/hooks/useCompanies';
import {Navbar} from '@/components/Navbar';

// Temporary mock data - will be replaced with real API data
const companies = [
	{
		id: 'ashby',
		companyID: 'ashby',
		name: 'Ashby',
		field: 'Recruiting & HR Tech',
		workModel: 'FULLY_REMOTE',
		ranking: 95,
		tracked: true,
	},
	{
		id: 'stripe',
		companyID: 'stripe',
		name: 'Stripe',
		field: 'Fintech & Payments',
		workModel: 'HYBRID',
		ranking: 92,
		tracked: false,
	},
	{
		id: 'google',
		companyID: 'google',
		name: 'Google',
		field: 'Search & Cloud',
		workModel: 'HYBRID',
		ranking: 98,
		tracked: true,
	},
	{
		id: 'netlify',
		companyID: 'netlify',
		name: 'Netlify',
		field: 'Web Development',
		workModel: 'FULLY_REMOTE',
		ranking: 88,
		tracked: false,
	},
	{
		id: 'apple',
		companyID: 'apple',
		name: 'Apple',
		field: 'Consumer Electronics',
		workModel: 'IN_OFFICE',
		ranking: 97,
		tracked: false,
	},
	{
		id: 'doist',
		companyID: 'doist',
		name: 'Doist',
		field: 'Productivity',
		workModel: 'FULLY_REMOTE',
		ranking: 85,
		tracked: true,
	},
	{
		id: 'miro',
		companyID: 'miro',
		name: 'Miro',
		field: 'Collaboration',
		workModel: 'HYBRID',
		ranking: 90,
		tracked: false,
	},
	{
		id: 'zapier',
		companyID: 'zapier',
		name: 'Zapier',
		field: 'Automation',
		workModel: 'FULLY_REMOTE',
		ranking: 93,
		tracked: true,
	},
];

type Company = (typeof companies)[0] & {companyID: string};

const CompanyCard = ({company}: {company: Company}) => {
	const {trackedCompanies, trackCompany, untrackCompany} = useCompanies();
	const isTracked = trackedCompanies.includes(company.companyID);

	const handleTrackingToggle = () => {
		if (isTracked) {
			untrackCompany(company.companyID);
		} else {
			trackCompany(company.companyID);
		}
	};

	return (
		<div
			className="company-card border rounded-2xl p-5 flex flex-col justify-between bg-[var(--card-bg)] border-[var(--card-border)]"
			data-name={company.name.toLowerCase()}
			data-work-model={company.workModel}
			data-ranking={company.ranking}
		>
			<div>
				<h3 className="font-bold text-lg text-[var(--text-color)]">
					{company.name}
				</h3>
				<p className="text-[var(--text-muted)] text-sm mt-1">{company.field}</p>
			</div>
			<div className="mt-4 flex items-center justify-between">
				<span
					className={`text-sm font-medium ${
						isTracked ? 'text-green-500' : 'text-[var(--text-muted)]'
					}`}
				>
					{isTracked ? 'Tracking' : 'Not Tracking'}
				</span>
				<label className="inline-flex items-center cursor-pointer">
					<input
						type="checkbox"
						className="sr-only peer"
						checked={isTracked}
						onChange={handleTrackingToggle}
					/>
					<div
						className="relative w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full 
                      peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 
                      peer transition-colors duration-200 ease-in-out
                      peer-checked:bg-purple-600"
					>
						<div
							className={`absolute top-0.5 left-[2px] bg-white h-5 w-5 rounded-full transition-transform duration-200 ease-in-out
                        ${isTracked ? 'translate-x-5' : 'translate-x-0'}`}
						></div>
					</div>
				</label>
			</div>
		</div>
	);
};

interface FiltersState {
	search: string;
	workModel: string;
	ranking: number;
	sort: string;
}

interface CompanyFiltersProps {
	onSearchChange: (value: string) => void;
	onWorkModelChange: (value: string) => void;
	onRankingChange: (value: number) => void;
	onSortChange: (value: string) => void;
	currentFilters: FiltersState;
}

const CompanyFilters = ({
	onSearchChange,
	onWorkModelChange,
	onRankingChange,
	onSortChange,
	currentFilters,
}: CompanyFiltersProps) => {
	return (
		<div className="border rounded-2xl p-6 mb-8 bg-[var(--card-bg)] border-[var(--card-border)]">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
				<div>
					<label
						htmlFor="search"
						className="block text-sm font-medium text-[var(--text-muted)] mb-2"
					>
						Search
					</label>
					<input
						type="text"
						id="search-input"
						placeholder="Company name..."
						className="w-full p-2 rounded-lg border bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-color)]
                                 focus:outline-none focus:ring-2 focus:ring-purple-500"
						onChange={e => onSearchChange(e.target.value)}
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
						Work Model
					</label>
					<div className="flex gap-2">
						{['all', 'FULLY_REMOTE', 'HYBRID'].map(model => (
							<button
								key={model}
								onClick={() => onWorkModelChange(model)}
								className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors
                                          ${
																						currentFilters.workModel === model
																							? 'bg-purple-600 text-white'
																							: 'bg-[var(--btn-filter-bg)] text-[var(--btn-filter-text)] hover:bg-[var(--btn-filter-hover-bg)]'
																					}`}
							>
								{model === 'all'
									? 'All'
									: model.split('_').join(' ').toLowerCase()}
							</button>
						))}
					</div>
				</div>

				<div>
					<label
						htmlFor="ranking-slider"
						className="block text-sm font-medium text-[var(--text-muted)] mb-2"
					>
						Min. Ranking:{' '}
						<span className="font-bold text-purple-600 dark:text-purple-400">
							{currentFilters.ranking}
						</span>
					</label>
					<input
						type="range"
						id="ranking-slider"
						min="0"
						max="100"
						value={currentFilters.ranking}
						onChange={e => onRankingChange(parseInt(e.target.value, 10))}
						className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
					/>
				</div>

				<div>
					<label
						htmlFor="sort-select"
						className="block text-sm font-medium text-[var(--text-muted)] mb-2"
					>
						Sort By
					</label>
					<select
						id="sort-select"
						onChange={e => onSortChange(e.target.value)}
						className="w-full p-2 rounded-lg border bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-color)]
                                 focus:outline-none focus:ring-2 focus:ring-purple-500"
					>
						<option value="name-asc">Name (A-Z)</option>
						<option value="name-desc">Name (Z-A)</option>
						<option value="ranking-desc">Ranking (High-Low)</option>
						<option value="ranking-asc">Ranking (Low-High)</option>
					</select>
				</div>
			</div>
		</div>
	);
};

export default function CompaniesPage() {
	const [filters, setFilters] = useState<FiltersState>({
		search: '',
		workModel: 'all',
		ranking: 50,
		sort: 'name-asc',
	});

	// Filter and sort companies
	const filteredCompanies = companies
		.filter(company => {
			const searchMatch = company.name
				.toLowerCase()
				.includes(filters.search.toLowerCase());
			const workModelMatch =
				filters.workModel === 'all' || company.workModel === filters.workModel;
			const rankingMatch = company.ranking >= filters.ranking;
			return searchMatch && workModelMatch && rankingMatch;
		})
		.sort((a, b) => {
			switch (filters.sort) {
				case 'name-asc':
					return a.name.localeCompare(b.name);
				case 'name-desc':
					return b.name.localeCompare(a.name);
				case 'ranking-desc':
					return b.ranking - a.ranking;
				case 'ranking-asc':
					return a.ranking - b.ranking;
				default:
					return 0;
			}
		});

	return (
		<div className="min-h-screen bg-[var(--bg-color)]">
			<Navbar onDemoClick={() => {}} />

			<main className="px-4 pb-24 pt-32">
				<div className="max-w-7xl mx-auto">
					<h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-[var(--text-color)]">
						Track Companies
					</h1>
					<p className="text-[var(--text-muted)] mb-8">
						Select the companies you want Scoutly to monitor for new job
						openings.
					</p>

					<CompanyFilters
						onSearchChange={search => setFilters(f => ({...f, search}))}
						onWorkModelChange={workModel =>
							setFilters(f => ({...f, workModel}))
						}
						onRankingChange={ranking => setFilters(f => ({...f, ranking}))}
						onSortChange={sort => setFilters(f => ({...f, sort}))}
						currentFilters={filters}
					/>

					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
						{filteredCompanies.map(company => (
							<CompanyCard key={company.id} company={company} />
						))}
					</div>
				</div>
			</main>
		</div>
	);
}
