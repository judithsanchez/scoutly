'use client';

import './companies.css';
import {useState, useEffect} from 'react'; // Added useEffect
import {useCompanies} from '@/hooks/useCompanies';
import {Navbar} from '@/components/Navbar';
import {ICompany, WorkModel} from '@/models/Company'; // Import ICompany
// Mock data removed, will use data from useCompanies hook
// type Company = (typeof companies)[0] & {companyID: string}; // This type will be replaced by ICompany

const CompanyCard = ({company}: {company: ICompany}) => {
	// Use ICompany
	const {
		trackedCompanies,
		trackCompany,
		untrackCompany,
		isLoading: isTrackingHookLoading, // Renamed to avoid conflict
	} = useCompanies();

	// Determine if the company is tracked by checking against the companyID from ICompany
	const isActuallyTracked =
		(Array.isArray(trackedCompanies) &&
			trackedCompanies.some(
				(trackedCompanyId: string) => trackedCompanyId === company.companyID,
			)) ||
		false;

	// Local state for optimistic UI and loading state for the toggle itself
	const [optimisticIsTracked, setOptimisticIsTracked] =
		useState(isActuallyTracked);
	const [isToggleLoading, setIsToggleLoading] = useState(false);

	// Effect to sync optimisticIsTracked when isActuallyTracked changes (e.g., after initial load or external update)
	useEffect(() => {
		setOptimisticIsTracked(isActuallyTracked);
	}, [isActuallyTracked]);

	const handleTrackingToggle = async () => {
		setIsToggleLoading(true);
		setOptimisticIsTracked(!optimisticIsTracked); // Optimistic update

		try {
			if (optimisticIsTracked) {
				// If it was tracked, now we untrack
				await untrackCompany(company.companyID);
			} else {
				// If it was not tracked, now we track
				await trackCompany(company.companyID);
			}
			// onSuccess in useMutation will invalidate and refetch,
			// which will trigger the useEffect above to sync isActuallyTracked
		} catch (error) {
			console.error('Failed to update tracking status', error);
			setOptimisticIsTracked(optimisticIsTracked); // Revert optimistic update on error
		} finally {
			setIsToggleLoading(false);
		}
	};

	return (
		<div
			className="company-card border rounded-2xl p-5 flex flex-col justify-between bg-[var(--card-bg)] border-[var(--card-border)]"
			data-name={company.company.toLowerCase()} // Use company.company for name
			data-work-model={company.work_model} // Use company.work_model
			data-ranking={company.ranking}
		>
			<div>
				<h3 className="font-bold text-lg text-[var(--text-color)]">
					{company.company} {/* Use company.company for name */}
				</h3>
				{/* Display fields, joining if it's an array */}
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
						disabled={isToggleLoading} // Disable while loading
					/>
					<div
						className="relative w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full 
                      peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 
                      peer transition-colors duration-200 ease-in-out
                      peer-checked:bg-purple-600"
					>
						<div
							className={`absolute top-0.5 left-[2px] bg-white h-5 w-5 rounded-full transition-transform duration-200 ease-in-out
                        ${
													optimisticIsTracked
														? 'translate-x-5'
														: 'translate-x-0'
												}`}
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
		ranking: 0, // Default to 0 to show all companies initially
		sort: 'name-asc',
	});

	const {
		companies: allCompanies, // Renamed to avoid conflict with filteredCompanies
		isLoading: isLoadingCompanies,
		isError: isErrorCompanies,
		error: companiesError,
		refetch: refetchCompanies,
		// trackedCompanies, trackCompany, untrackCompany are used in CompanyCard
	} = useCompanies();

	// Filter and sort companies
	const filteredCompanies = (allCompanies ?? ([] as ICompany[])) // Ensure allCompanies is an array with correct type
		.filter((company: ICompany) => {
			const searchMatch = company.company // Use company.company for name
				.toLowerCase()
				.includes(filters.search.toLowerCase());
			const workModelMatch =
				filters.workModel === 'all' || company.work_model === filters.workModel; // Use company.work_model
			const rankingMatch = company.ranking >= filters.ranking;
			return searchMatch && workModelMatch && rankingMatch;
		})
		.sort((a: ICompany, b: ICompany) => {
			switch (filters.sort) {
				case 'name-asc':
					return a.company.localeCompare(b.company); // Use company.company for name
				case 'name-desc':
					return b.company.localeCompare(a.company); // Use company.company for name
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

					{isLoadingCompanies && (
						<div className="text-center py-10 text-[var(--text-muted)]">
							Loading companies...
						</div>
					)}
					{isErrorCompanies && (
						<div className="text-center py-10 space-y-4">
							<p className="text-red-500 font-medium">
								{companiesError instanceof Error
									? companiesError.message.includes('timeout')
										? 'The request took too long to complete. Please try again.'
										: companiesError.message.includes('Database connection')
										? 'Unable to connect to the database. Please try again later.'
										: 'Error loading companies. Please try again later.'
									: 'An unexpected error occurred. Please try again later.'}
							</p>
							<button
								onClick={() => refetchCompanies()}
								className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
							>
								Try Again
							</button>
						</div>
					)}
					{!isLoadingCompanies && !isErrorCompanies && (
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
							{filteredCompanies.length > 0 ? (
								filteredCompanies.map((company: ICompany) => (
									<CompanyCard key={company.companyID} company={company} /> // Use companyID as key
								))
							) : (
								<p className="text-center col-span-full py-10 text-[var(--text-muted)]">
									No companies match your current filters.
								</p>
							)}
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
