'use client';

import {Navbar} from '@/components/Navbar';
import {useCompanies} from '@/hooks/useCompanies';
import type {TrackedCompany, ICompanyWithId} from '@/hooks/useCompanies';
import {useEffect, useState} from 'react';
import {AddCompanyModal} from '@/components/AddCompanyModal';
import {
	PAGE_BACKGROUND_CONTAINER,
	PAGE_BACKGROUND_GLOW,
	PAGE_CONTENT_CONTAINER,
	CARD_CONTAINER,
	HEADING_LG,
	HEADING_MD,
	TEXT_SECONDARY,
	BUTTON_PRIMARY,
	FLEX_BETWEEN,
} from '@/constants/styles';
import styles from './CompaniesPage.module.css';

const CompanyCard = ({company}: {company: ICompanyWithId}) => {
	const {
		trackedCompanies,
		trackCompany,
		untrackCompany,
		updateRanking,
		isLoading: isTrackingHookLoading,
	} = useCompanies();

	const trackedCompany = Array.isArray(trackedCompanies)
		? trackedCompanies.find(
				(tracked: TrackedCompany) => tracked.id === company.id,
		  )
		: undefined;

	const isActuallyTracked = !!trackedCompany;
	const companyRanking = trackedCompany?.userPreference?.rank ?? 75;

	const [optimisticIsTracked, setOptimisticIsTracked] =
		useState(isActuallyTracked);
	const [optimisticRanking, setOptimisticRanking] = useState(companyRanking);
	const [isToggleLoading, setIsToggleLoading] = useState(false);
	const [isEditingRanking, setIsEditingRanking] = useState(false);
	const [isRankingLoading, setIsRankingLoading] = useState(false);

	useEffect(() => {
		setOptimisticIsTracked(isActuallyTracked);
		setOptimisticRanking(companyRanking);
	}, [isActuallyTracked, companyRanking]);

	const handleTrackingToggle = async () => {
		setIsToggleLoading(true);
		setOptimisticIsTracked(!optimisticIsTracked);

		try {
			if (optimisticIsTracked) {
				await untrackCompany(company.id);
			} else {
				await trackCompany(company.id, optimisticRanking);
			}
		} catch (error) {
			console.log('Failed to update company tracking status', {
				error,
				companyId: company.id,
			});
			setOptimisticIsTracked(optimisticIsTracked);
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
			await updateRanking(company.id, optimisticRanking);
		} catch (error) {
			console.log('Failed to update company ranking', {
				error,
				companyId: company.id,
				newRanking: optimisticRanking,
			});
			setOptimisticRanking(companyRanking);
		} finally {
			setIsRankingLoading(false);
			setIsEditingRanking(false);
		}
	};

	return (
		<div
			className={`${styles.card} ${CARD_CONTAINER}`}
			data-name={company.company.toLowerCase()}
			data-work-model={company.work_model}
			data-ranking={optimisticRanking}
		>
			<div>
				<h3 className={HEADING_MD}>{company.company}</h3>
				<p className={`${TEXT_SECONDARY} ${styles.centerText}`}>
					{Array.isArray(company.fields) && company.fields.length > 0
						? company.fields.join(', ')
						: typeof company.fields === 'string'
						? company.fields
						: 'N/A'}
				</p>

				{optimisticIsTracked && (
					<div style={{marginTop: '0.75rem'}}>
						<div className={styles.flexBetween}>
							<span
								style={{
									fontSize: '0.875rem',
									fontWeight: 500,
									color: 'var(--text-color)',
								}}
							>
								Ranking: {optimisticRanking}/100
							</span>
							{!isEditingRanking ? (
								<button
									onClick={() => setIsEditingRanking(true)}
									style={{color: '#a78bfa'}}
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
									style={{color: '#22c55e'}}
								>
									{isRankingLoading ? 'Saving...' : 'Save'}
								</button>
							)}
						</div>

						{isEditingRanking && (
							<div style={{marginTop: '0.5rem'}}>
								<input
									type="range"
									min="1"
									max="100"
									value={optimisticRanking}
									onChange={e =>
										handleRankingChange(Math.max(1, parseInt(e.target.value)))
									}
									className={styles.rankingSlider}
								/>
								<div className={styles.rankingLabels}>
									<span>1</span>
									<span>50</span>
									<span>100</span>
								</div>
							</div>
						)}
					</div>
				)}
			</div>

			<div style={{marginTop: '1rem'}} className={styles.flexBetween}>
				<span
					style={{
						fontSize: '0.875rem',
						fontWeight: 500,
						color: optimisticIsTracked ? '#22c55e' : 'var(--text-muted)',
					}}
				>
					{isToggleLoading
						? 'Updating...'
						: optimisticIsTracked
						? 'Tracking'
						: 'Not Tracking'}
				</span>
				<label
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						cursor: 'pointer',
					}}
				>
					<input
						type="checkbox"
						className="sr-only"
						checked={optimisticIsTracked}
						onChange={handleTrackingToggle}
						disabled={isToggleLoading}
					/>
					<div
						className={`${styles.toggleSwitch} ${
							optimisticIsTracked ? styles.toggleSwitchChecked : ''
						}`}
					>
						<div
							className={`${styles.toggleThumb} ${
								optimisticIsTracked ? styles.toggleThumbChecked : ''
							}`}
						/>
					</div>
				</label>
			</div>
		</div>
	);
};

interface FiltersState {
	search: string;
	workModel: string;
	sort: string;
	showTrackedOnly: boolean;
	ranking: number;
}

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
		<div className={`${CARD_CONTAINER} ${styles.filterBar}`}>
			<div className={styles.gridFilters}>
				<div>
					<label
						htmlFor="search-input"
						style={{
							display: 'block',
							fontSize: '0.875rem',
							fontWeight: 500,
							color: 'var(--text-muted)',
							marginBottom: '0.5rem',
						}}
					>
						Search
					</label>
					<input
						type="text"
						id="search-input"
						placeholder="Company name..."
						className={styles.input}
						value={currentFilters.search}
						onChange={e => onSearchChange(e.target.value)}
					/>
				</div>

				<div
					style={
						currentFilters.showTrackedOnly
							? {
									background: 'var(--purple-50, #f5f3ff)',
									borderRadius: '0.5rem',
									padding: '0.75rem',
							  }
							: {}
					}
				>
					<label
						style={{
							display: 'block',
							fontSize: '0.875rem',
							fontWeight: 500,
							color: 'var(--text-muted)',
							marginBottom: '0.5rem',
						}}
					>
						Show Tracked Only
					</label>
					<label
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							cursor: 'pointer',
						}}
					>
						<input
							type="checkbox"
							className="sr-only"
							checked={currentFilters.showTrackedOnly}
							onChange={e => onShowTrackedOnlyChange(e.target.checked)}
						/>
						<div
							className={`${styles.toggleSwitch} ${
								currentFilters.showTrackedOnly ? styles.toggleSwitchChecked : ''
							}`}
						>
							<div
								className={`${styles.toggleThumb} ${
									currentFilters.showTrackedOnly
										? styles.toggleThumbChecked
										: ''
								}`}
							/>
						</div>
						<span
							style={{
								marginLeft: '0.5rem',
								color: currentFilters.showTrackedOnly
									? '#a78bfa'
									: 'var(--text-color)',
								fontWeight: currentFilters.showTrackedOnly ? 600 : 400,
							}}
						>
							{currentFilters.showTrackedOnly
								? 'Showing Tracked Only'
								: 'All Companies'}
						</span>
					</label>
				</div>

				<div>
					<label
						style={{
							display: 'block',
							fontSize: '0.875rem',
							fontWeight: 500,
							color: 'var(--text-muted)',
							marginBottom: '0.5rem',
						}}
					>
						Work Model
					</label>
					<div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
						{['all', 'FULLY_REMOTE', 'HYBRID', 'IN_OFFICE'].map(model => (
							<button
								key={model}
								onClick={() => onWorkModelChange(model)}
								className={`${styles.btnFilter} ${
									currentFilters.workModel === model ? 'active' : ''
								}`}
							>
								{model === 'all'
									? 'All'
									: model === 'FULLY_REMOTE'
									? 'Remote'
									: model === 'HYBRID'
									? 'Hybrid'
									: 'On-Site'}
							</button>
						))}
					</div>
				</div>

				<div>
					<label
						htmlFor="sort-select"
						style={{
							display: 'block',
							fontSize: '0.875rem',
							fontWeight: 500,
							color: 'var(--text-muted)',
							marginBottom: '0.5rem',
						}}
					>
						Sort By
					</label>
					<select
						id="sort-select"
						className={styles.input}
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
		showTrackedOnly: false,
		ranking: 0,
	});

	useEffect(() => {
		if (
			!isLoading &&
			trackedCompanies &&
			trackedCompanies.length === 0 &&
			filters.showTrackedOnly
		) {
			setFilters(prev => ({...prev, showTrackedOnly: false}));
		}
	}, [isLoading, trackedCompanies, filters.showTrackedOnly]);

	const getCompanyRanking = (companyId: string): number => {
		const tracked = trackedCompanies.find(
			(t: TrackedCompany) => t.id === companyId,
		);
		return tracked?.userPreference?.rank ?? 0;
	};

	const filteredCompanies = (allCompanies ?? ([] as ICompanyWithId[]))
		.filter((company: ICompanyWithId) => {
			const searchMatch = company.company
				.toLowerCase()
				.includes(filters.search.toLowerCase());
			const workModelMatch =
				filters.workModel === 'all' || company.work_model === filters.workModel;
			const trackedMatch =
				!filters.showTrackedOnly ||
				trackedCompanies.some(
					(tracked: TrackedCompany) => tracked.id === company.id,
				);

			return searchMatch && workModelMatch && trackedMatch;
		})
		.sort((a: ICompanyWithId, b: ICompanyWithId) => {
			switch (filters.sort) {
				case 'name-asc':
					return a.company.localeCompare(b.company);
				case 'name-desc':
					return b.company.localeCompare(a.company);
				case 'ranking-desc':
					return getCompanyRanking(b.id) - getCompanyRanking(a.id);
				case 'ranking-asc':
					return getCompanyRanking(a.id) - getCompanyRanking(b.id);
				default:
					return 0;
			}
		});

	return (
		<div className={PAGE_BACKGROUND_CONTAINER}>
			<div className={PAGE_BACKGROUND_GLOW}></div>
			<Navbar onDemoClick={() => {}} />
			<main
				className={PAGE_CONTENT_CONTAINER.replace('max-w-4xl', 'max-w-7xl')}
			>
				<div style={{maxWidth: '80rem', margin: '0 auto'}}>
					<div className={styles.flexBetween}>
						<div>
							<h1 className={HEADING_LG}>Track Companies</h1>
							<p className={TEXT_SECONDARY}>
								Select the companies you want Scoutly to monitor for new job
								openings.
							</p>
						</div>
						<button
							onClick={() => setIsAddCompanyModalOpen(true)}
							className={styles.addCompanyBtn}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								fill="currentColor"
								viewBox="0 0 16 16"
								className={styles.mr2}
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
						<div className={styles.centerText}>Loading companies...</div>
					)}
					{isError && (
						<div className={styles.errorText}>
							<p>Error loading companies.</p>
							{error && <p style={{fontSize: '0.875rem'}}>{error.message}</p>}
						</div>
					)}
					{!isLoading && !isError && filteredCompanies.length === 0 && (
						<div className={styles.centerText}>
							No companies match your current filters.
						</div>
					)}
					{!isLoading && !isError && filteredCompanies.length > 0 && (
						<div id="company-grid" className={styles.companyGrid}>
							{filteredCompanies.map(company => (
								<CompanyCard key={company.id} company={company} />
							))}
						</div>
					)}
				</div>
			</main>

			<AddCompanyModal
				isOpen={isAddCompanyModalOpen}
				onClose={() => setIsAddCompanyModalOpen(false)}
				onAddCompany={async (companyData, track, ranking) => {
					try {
						const result = await createCompany(companyData);

						if (
							track &&
							typeof result === 'object' &&
							result !== null &&
							'company' in result &&
							typeof (result as any).company === 'object' &&
							(result as any).company !== null &&
							'id' in (result as any).company
						) {
							await trackCompany((result as any).company.id, ranking);
						}

						setIsAddCompanyModalOpen(false);
					} catch (error) {
						console.log('Failed to create company', {error});
						throw error;
					}
				}}
			/>
		</div>
	);
}
