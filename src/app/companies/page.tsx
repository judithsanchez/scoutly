'use client';

import {Navbar} from '@/components/Navbar';
import {useCompanies} from '@/hooks/useCompanies';
import {ICompany} from '@/models/Company';
import {useEffect, useState} from 'react';

const CompanyCard = ({company}: {company: ICompany}) => {
	const {
		trackedCompanies,
		trackCompany,
		untrackCompany,
		isLoading: isTrackingHookLoading,
	} = useCompanies();

	// Update to work with new structure: array of {companyID, ranking}
	const isActuallyTracked =
		Array.isArray(trackedCompanies) &&
		trackedCompanies.some(tracked => tracked.companyID === company.companyID);

	// Local state for optimistic UI and loading state for the toggle itself
	const [optimisticIsTracked, setOptimisticIsTracked] =
		useState(isActuallyTracked);
	const [isToggleLoading, setIsToggleLoading] = useState(false);

	// Effect to sync optimisticIsTracked when isActuallyTracked changes
	useEffect(() => {
		setOptimisticIsTracked(isActuallyTracked);
	}, [isActuallyTracked]);

	const handleTrackingToggle = async () => {
		setIsToggleLoading(true);
		setOptimisticIsTracked(!optimisticIsTracked);

		try {
			if (optimisticIsTracked) {
				await untrackCompany(company.companyID);
			} else {
				// Pass default ranking of 75 when tracking
				await trackCompany(company.companyID, 75);
			}
		} catch (error) {
			console.error('Failed to update tracking status', error);
			setOptimisticIsTracked(optimisticIsTracked); // Revert on error
		} finally {
			setIsToggleLoading(false);
		}
	};

	// Rest of component unchanged...
	return (
		<div
			className="company-card border rounded-2xl p-5 flex flex-col justify-between bg-[var(--card-bg)] border-[var(--card-border)]"
			data-name={company.company.toLowerCase()}
			data-work-model={company.work_model}
		>
			{/* Remove data-ranking since companies don't have rankings anymore */}
			<div>
				<h3 className="font-bold text-lg text-[var(--text-color)]">
					{company.company}
				</h3>
				<p className="text-[var(--text-muted)] text-sm mt-1">
					{Array.isArray(company.fields) && company.fields.length > 0
						? company.fields.join(', ')
						: typeof company.fields === 'string'
						? company.fields
						: 'N/A'}
				</p>
			</div>
			<div className="mt-4 flex items-center justify-between">
				<span
					className={`text-sm font-medium ${
						optimisticIsTracked ? 'text-green-500' : 'text-[var(--text-muted)]'
					}`}
				>
					{isToggleLoading
						? 'Updating...'
						: optimisticIsTracked
						? 'Tracking'
						: 'Not Tracking'}
				</span>
				<label className="inline-flex items-center cursor-pointer">
					<input
						type="checkbox"
						className="sr-only peer"
						checked={optimisticIsTracked}
						onChange={handleTrackingToggle}
						disabled={isToggleLoading}
					/>
					<div className="relative w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 peer transition-colors duration-200 ease-in-out peer-checked:bg-purple-600">
						<div
							className={`absolute top-0.5 left-[2px] bg-white h-5 w-5 rounded-full transition-transform duration-200 ease-in-out ${
								optimisticIsTracked ? 'translate-x-5' : 'translate-x-0'
							}`}
						></div>
					</div>
				</label>
			</div>
		</div>
	);
};

// Update the filters to remove ranking filter since companies don't have rankings
interface FiltersState {
	search: string;
	workModel: string;
	sort: string;
	// Remove: ranking: number;
}

// Update CompanyFilters to remove ranking filter
const CompanyFilters = ({
	onSearchChange,
	onWorkModelChange,
	onSortChange,
	currentFilters,
}: {
	onSearchChange: (value: string) => void;
	onWorkModelChange: (value: string) => void;
	onSortChange: (value: string) => void;
	currentFilters: FiltersState;
}) => {
	return (
		<div className="border rounded-2xl p-6 mb-8 bg-[var(--card-bg)] border-[var(--card-border)]">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
				<div>
					<label
						htmlFor="search-input"
						className="block text-sm font-medium text-[var(--text-muted)] mb-2"
					>
						Search
					</label>
					<input
						type="text"
						id="search-input"
						placeholder="Company name..."
						className="input w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-color)]"
						value={currentFilters.search}
						onChange={e => onSearchChange(e.target.value)}
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
						Work Model
					</label>
					<div className="flex gap-2">
						<button
							onClick={() => onWorkModelChange('all')}
							className={`btn-filter flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
								currentFilters.workModel === 'all'
									? 'active bg-purple-600 text-white'
									: 'bg-[var(--btn-filter-bg)] text-[var(--btn-filter-text)] hover:bg-[var(--btn-filter-hover-bg)]'
							}`}
						>
							All
						</button>
						<button
							onClick={() => onWorkModelChange('FULLY_REMOTE')}
							className={`btn-filter flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
								currentFilters.workModel === 'FULLY_REMOTE'
									? 'active bg-purple-600 text-white'
									: 'bg-[var(--btn-filter-bg)] text-[var(--btn-filter-text)] hover:bg-[var(--btn-filter-hover-bg)]'
							}`}
						>
							Remote
						</button>
						<button
							onClick={() => onWorkModelChange('HYBRID')}
							className={`btn-filter flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
								currentFilters.workModel === 'HYBRID'
									? 'active bg-purple-600 text-white'
									: 'bg-[var(--btn-filter-bg)] text-[var(--btn-filter-text)] hover:bg-[var(--btn-filter-hover-bg)]'
							}`}
						>
							Hybrid
						</button>
					</div>
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
						className="input w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-color)]"
						value={currentFilters.sort}
						onChange={e => onSortChange(e.target.value)}
					>
						<option value="name-asc">Name (A-Z)</option>
						<option value="name-desc">Name (Z-A)</option>
						{/* Ranking sort options removed as per previous logic */}
					</select>
				</div>
			</div>
		</div>
	);
};

// Update the main component
export default function CompaniesPage() {
	const {companies: allCompanies, isLoading, isError, error} = useCompanies();
	const [filters, setFilters] = useState<FiltersState>({
		search: '',
		workModel: 'all',
		sort: 'name-asc',
		// Remove: ranking: 0,
	});

	// Update filtering logic to remove ranking filter
	const filteredCompanies = (allCompanies ?? ([] as ICompany[]))
		.filter((company: ICompany) => {
			const searchMatch = company.company
				.toLowerCase()
				.includes(filters.search.toLowerCase());
			const workModelMatch =
				filters.workModel === 'all' || company.work_model === filters.workModel;
			// Remove: const rankingMatch = company.ranking >= filters.ranking;
			return searchMatch && workModelMatch; // Remove && rankingMatch
		})
		.sort((a: ICompany, b: ICompany) => {
			switch (filters.sort) {
				case 'name-asc':
					return a.company.localeCompare(b.company);
				case 'name-desc':
					return b.company.localeCompare(a.company);
				// Remove ranking-based sorting
				default:
					return 0;
			}
		});

	// Update CompanyFilters props to remove ranking-related props
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
						onSortChange={sort => setFilters(f => ({...f, sort}))}
						currentFilters={filters}
					/>

					{isLoading && (
						<div className="text-center py-10 text-[var(--text-muted)]">
							Loading companies...
						</div>
					)}
					{isError && (
						<div className="text-center py-10 text-red-500">
							<p>Error loading companies.</p>
							{error && <p className="text-sm">{error.message}</p>}
						</div>
					)}
					{!isLoading && !isError && filteredCompanies.length === 0 && (
						<div className="text-center py-10 text-[var(--text-muted)]">
							No companies match your current filters.
						</div>
					)}
					{!isLoading && !isError && filteredCompanies.length > 0 && (
						<div
							id="company-grid"
							className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
						>
							{filteredCompanies.map(company => (
								<CompanyCard key={company.companyID} company={company} />
							))}
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
