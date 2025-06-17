'use client';

import {Navbar} from '@/components/Navbar';
import {useCompanies} from '@/hooks/useCompanies';
import {ICompany} from '@/types/company';
import {useEffect, useState} from 'react';
import {AddCompanyModal} from '@/components/AddCompanyModal';

const CompanyCard = ({company}: {company: ICompany}) => {
	const {
		trackedCompanies,
		trackCompany,
		untrackCompany,
		updateRanking,
		isLoading: isTrackingHookLoading,
	} = useCompanies();

	// Update to work with new structure: array of {companyID, ranking}
	const trackedCompany = Array.isArray(trackedCompanies)
		? trackedCompanies.find(tracked => tracked.companyID === company.companyID)
		: undefined;

	const isActuallyTracked = !!trackedCompany;
	const companyRanking = trackedCompany?.ranking ?? 75;

	// Local state for optimistic UI and loading state for the toggle itself
	const [optimisticIsTracked, setOptimisticIsTracked] =
		useState(isActuallyTracked);
	const [optimisticRanking, setOptimisticRanking] = useState(companyRanking);
	const [isToggleLoading, setIsToggleLoading] = useState(false);
	const [isEditingRanking, setIsEditingRanking] = useState(false);
	const [isRankingLoading, setIsRankingLoading] = useState(false);

	// Effect to sync optimistic states when data changes
	useEffect(() => {
		setOptimisticIsTracked(isActuallyTracked);
		setOptimisticRanking(companyRanking);
	}, [isActuallyTracked, companyRanking]);

	const handleTrackingToggle = async () => {
		setIsToggleLoading(true);
		setOptimisticIsTracked(!optimisticIsTracked);

		try {
			if (optimisticIsTracked) {
				await untrackCompany(company.companyID);
			} else {
				// Pass default ranking of 75 when tracking
				await trackCompany(company.companyID, optimisticRanking);
			}
		} catch (error) {
			console.error('Failed to update tracking status', error);
			setOptimisticIsTracked(optimisticIsTracked); // Revert on error
		} finally {
			setIsToggleLoading(false);
		}
	};

	const handleRankingChange = (newRanking: number) => {
		setOptimisticRanking(newRanking);
	};

	const handleRankingSave = async () => {
		setIsRankingLoading(true);
		try {
			console.log(
				`Updating ranking for company ${company.companyID} to ${optimisticRanking}`,
			);
			await updateRanking(company.companyID, optimisticRanking);
			console.log(
				`Successfully updated ranking for company ${company.companyID}`,
			);
		} catch (error) {
			console.error(
				`Failed to update ranking for company ${company.companyID}:`,
				error,
			);
			setOptimisticRanking(companyRanking); // Revert on error
		} finally {
			setIsRankingLoading(false);
			setIsEditingRanking(false);
		}
	};

	// Rest of component unchanged...
	return (
		<div
			className="company-card border rounded-2xl p-5 flex flex-col justify-between bg-[var(--card-bg)] border-[var(--card-border)]"
			data-name={company.company.toLowerCase()}
			data-work-model={company.work_model}
			data-ranking={optimisticRanking}
		>
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

				{optimisticIsTracked && (
					<div className="mt-3">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium text-[var(--text-color)]">
								Ranking: {optimisticRanking}/100
							</span>
							{!isEditingRanking ? (
								<button
									onClick={() => setIsEditingRanking(true)}
									className="text-purple-500 hover:text-purple-600 focus:outline-none"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="16"
										height="16"
										fill="currentColor"
										viewBox="0 0 16 16"
									>
										<path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z" />
									</svg>
								</button>
							) : (
								<button
									onClick={handleRankingSave}
									disabled={isRankingLoading}
									className="text-green-500 hover:text-green-600 focus:outline-none"
								>
									{isRankingLoading ? 'Saving...' : 'Save'}
								</button>
							)}
						</div>

						{isEditingRanking && (
							<div className="mt-2">
								<input
									type="range"
									min="0"
									max="100"
									value={optimisticRanking}
									onChange={e => handleRankingChange(parseInt(e.target.value))}
									className="w-full"
								/>
								<div className="flex justify-between mt-1 text-xs text-[var(--text-muted)]">
									<span>0</span>
									<span>50</span>
									<span>100</span>
								</div>
							</div>
						)}
					</div>
				)}
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

// Update the filters to include tracked filter and ranking filter
interface FiltersState {
	search: string;
	workModel: string;
	sort: string;
	showTrackedOnly: boolean;
	ranking: number;
}

// Update CompanyFilters to include tracked only filter and ranking sort
const CompanyFilters = ({
	onSearchChange,
	onWorkModelChange,
	onSortChange,
	onShowTrackedOnlyChange,
	currentFilters,
}: {
	onSearchChange: (value: string) => void;
	onWorkModelChange: (value: string) => void;
	onSortChange: (value: string) => void;
	onShowTrackedOnlyChange: (value: boolean) => void;
	currentFilters: FiltersState;
}) => {
	return (
		<div className="border rounded-2xl p-6 mb-8 bg-[var(--card-bg)] border-[var(--card-border)]">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
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

				<div
					className={`${
						currentFilters.showTrackedOnly
							? 'bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg'
							: ''
					}`}
				>
					<label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
						Show Tracked Only
					</label>
					<label className="inline-flex items-center cursor-pointer">
						<input
							type="checkbox"
							className="sr-only peer"
							checked={currentFilters.showTrackedOnly}
							onChange={e => onShowTrackedOnlyChange(e.target.checked)}
						/>
						<div className="relative w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 peer transition-colors duration-200 ease-in-out peer-checked:bg-purple-600">
							<div
								className={`absolute top-0.5 left-[2px] bg-white h-5 w-5 rounded-full transition-transform duration-200 ease-in-out ${
									currentFilters.showTrackedOnly
										? 'translate-x-5'
										: 'translate-x-0'
								}`}
							></div>
						</div>
						<span
							className={`ml-2 ${
								currentFilters.showTrackedOnly
									? 'text-purple-700 dark:text-purple-300 font-semibold'
									: 'text-[var(--text-color)]'
							}`}
						>
							{currentFilters.showTrackedOnly
								? 'Showing Tracked Only'
								: 'All Companies'}
						</span>
					</label>
				</div>

				<div>
					<label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
						Work Model
					</label>
					<div className="flex flex-wrap gap-2">
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
						<button
							onClick={() => onWorkModelChange('IN_OFFICE')}
							className={`btn-filter flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
								currentFilters.workModel === 'IN_OFFICE'
									? 'active bg-purple-600 text-white'
									: 'bg-[var(--btn-filter-bg)] text-[var(--btn-filter-text)] hover:bg-[var(--btn-filter-hover-bg)]'
							}`}
						>
							On-Site
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
						<option value="ranking-desc">Ranking (High to Low)</option>
						<option value="ranking-asc">Ranking (Low to High)</option>
					</select>
				</div>
			</div>
		</div>
	);
};

// Update the main component
export default function CompaniesPage() {
	const {
		companies: allCompanies,
		trackedCompanies,
		isLoading,
		isError,
		error,
		createCompany,
		trackCompany,
		isCreatingCompany,
	} = useCompanies();

	const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);

	const [filters, setFilters] = useState<FiltersState>({
		search: '',
		workModel: 'all',
		sort: 'name-asc',
		showTrackedOnly: true, // Default to showing tracked companies only
		ranking: 0,
	});

	// Effect to ensure tracked companies are shown by default if there are any
	useEffect(() => {
		if (!isLoading && trackedCompanies && trackedCompanies.length > 0) {
			setFilters(prev => ({...prev, showTrackedOnly: true}));
		} else if (
			!isLoading &&
			trackedCompanies &&
			trackedCompanies.length === 0
		) {
			// If there are no tracked companies, show all companies
			setFilters(prev => ({...prev, showTrackedOnly: false}));
		}
	}, [isLoading, trackedCompanies]);

	// Helper function to get company ranking
	const getCompanyRanking = (companyId: string): number => {
		const tracked = trackedCompanies.find(t => t.companyID === companyId);
		return tracked?.ranking ?? 0;
	};

	// Update filtering logic to include showTrackedOnly filter
	const filteredCompanies = (allCompanies ?? ([] as ICompany[]))
		.filter(company => {
			const searchMatch = company.company
				.toLowerCase()
				.includes(filters.search.toLowerCase());
			const workModelMatch =
				filters.workModel === 'all' || company.work_model === filters.workModel;
			const trackedMatch =
				!filters.showTrackedOnly ||
				trackedCompanies.some(
					tracked => tracked.companyID === company.companyID,
				);

			return searchMatch && workModelMatch && trackedMatch;
		})
		.sort((a, b) => {
			switch (filters.sort) {
				case 'name-asc':
					return a.company.localeCompare(b.company);
				case 'name-desc':
					return b.company.localeCompare(a.company);
				case 'ranking-desc':
					return (
						getCompanyRanking(b.companyID) - getCompanyRanking(a.companyID)
					);
				case 'ranking-asc':
					return (
						getCompanyRanking(a.companyID) - getCompanyRanking(b.companyID)
					);
				default:
					return 0;
			}
		});

	// Add useEffect to check if there are tracked companies and adjust filter accordingly
	useEffect(() => {
		// If there are no tracked companies, show all companies instead
		if (trackedCompanies && trackedCompanies.length === 0) {
			setFilters(prev => ({...prev, showTrackedOnly: false}));
		}
	}, [trackedCompanies]);

	// Update CompanyFilters props to remove ranking-related props
	return (
		<div className="bg-[var(--page-bg)] text-[var(--text-color)] min-h-screen">
			<div className="background-glows fixed inset-0 z-0"></div>
			<Navbar onDemoClick={() => {}} />
			<main className="relative z-10 px-4 pb-24 pt-32">
				<div className="max-w-7xl mx-auto">
					<div className="flex flex-wrap justify-between items-center mb-8">
						<div>
							<h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-[var(--text-color)]">
								Track Companies
							</h1>
							<p className="text-[var(--text-muted)]">
								Select the companies you want Scoutly to monitor for new job
								openings.
							</p>
						</div>
						<button
							onClick={() => setIsAddCompanyModalOpen(true)}
							className="mt-4 md:mt-0 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								fill="currentColor"
								viewBox="0 0 16 16"
							>
								<path d="M8 0a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2H9v6a1 1 0 1 1-2 0V9H1a1 1 0 1 1 0-2h6V1a1 1 0 0 1 1-1z" />
							</svg>
							Add Company
						</button>
					</div>

					<CompanyFilters
						onSearchChange={search => setFilters(f => ({...f, search}))}
						onWorkModelChange={workModel =>
							setFilters(f => ({...f, workModel}))
						}
						onSortChange={sort => setFilters(f => ({...f, sort}))}
						onShowTrackedOnlyChange={showTrackedOnly =>
							setFilters(f => ({...f, showTrackedOnly}))
						}
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

			{/* Add Company Modal */}
			<AddCompanyModal
				isOpen={isAddCompanyModalOpen}
				onClose={() => setIsAddCompanyModalOpen(false)}
				onAddCompany={async (companyData, track, ranking) => {
					try {
						// Create the company first
						const result = await createCompany(companyData);

						// If tracking is requested, track the company with the specified ranking
						if (track && result.company) {
							await trackCompany(result.company.companyID, ranking);
						}

						// Close the modal after successful creation
						setIsAddCompanyModalOpen(false);
					} catch (error) {
						console.error('Failed to create company:', error);
						throw error;
					}
				}}
			/>
		</div>
	);
}
