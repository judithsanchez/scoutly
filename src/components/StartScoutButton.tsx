'use client';

import React, {useState} from 'react';
import {useCompanies} from '@/hooks/useCompanies';
import config from '@/config/appConfig';

interface StartScoutButtonProps {
	onScoutStart?: (selectedCompanyIds: string[]) => Promise<void>;
	className?: string;
}

export default function StartScoutButton({
	onScoutStart,
	className = '',
}: StartScoutButtonProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const {
		companies,
		trackedCompanies,
		isLoading: isLoadingCompanies,
		isRefetching: isLoadingTrackedCompanies,
	} = useCompanies();

	const companiesWithId =
		companies as unknown as import('@/hooks/useCompanies').ICompanyWithId[];

	const availableCompanies = React.useMemo(() => {
		if (
			!companiesWithId ||
			!trackedCompanies ||
			!companiesWithId.length ||
			!trackedCompanies.length
		)
			return [];

		const now = new Date();

		return companiesWithId.filter(
			(company: import('@/hooks/useCompanies').ICompanyWithId) => {
				const trackedCompany = trackedCompanies.find(
					(tc: import('@/hooks/useCompanies').TrackedCompany) =>
						tc.id === company.id,
				);

				if (!trackedCompany) return false;

				if (!company.lastSuccessfulScrape) return true;

				const scrapeDate = new Date(company.lastSuccessfulScrape);
				const daysSinceScrape = Math.floor(
					(now.getTime() - scrapeDate.getTime()) / (1000 * 60 * 60 * 24),
				);

				return daysSinceScrape >= config.app.companyScrapeIntervalDays;
			},
		);
	}, [companiesWithId, trackedCompanies]);

	const handleScoutStart = async () => {
		if (!onScoutStart || selectedCompanies.length === 0) return;

		try {
			setIsLoading(true);
			await onScoutStart(selectedCompanies);
			setIsModalOpen(false);
			setSelectedCompanies([]);
		} catch (error) {
			console.log('Failed to start scout', {error, selectedCompanies});
		} finally {
			setIsLoading(false);
		}
	};

	const toggleCompanySelection = (companyId: string) => {
		if (selectedCompanies.includes(companyId)) {
			setSelectedCompanies(
				selectedCompanies.filter((id: string) => id !== companyId),
			);
		} else {
			setSelectedCompanies([...selectedCompanies, companyId]);
		}
	};

	const selectAllCompanies = () => {
		setSelectedCompanies(
			availableCompanies.map(
				(company: import('@/hooks/useCompanies').ICompanyWithId) => company.id,
			),
		);
	};

	const clearSelection = () => {
		setSelectedCompanies([]);
	};

	return (
		<>
			<button
				onClick={() => setIsModalOpen(true)}
				disabled={
					isLoadingCompanies ||
					isLoadingTrackedCompanies ||
					availableCompanies.length === 0
				}
				className={`bg-purple-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-purple-700 transition-all shadow-lg 
		  hover:shadow-purple-500/30 transform hover:-translate-y-0.5 flex items-center justify-center gap-2
		  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none ${className}`}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M12 2a10 10 0 1 0 10 10c0-4.42-2.87-8.1-6.84-9.48"></path>
					<path d="M12 2a10 10 0 1 0 10 10c0-4.42-2.87-8.1-6.84-9.48"></path>
					<circle cx="12" cy="12" r="2"></circle>
					<path d="M12 12h.01"></path>
					<path d="M22 12h-2"></path>
					<path d="M6 12H4"></path>
					<path d="m15.5 15.5.7.7"></path>
					<path d="m8.5 8.5.7.7"></path>
					<path d="m15.5 8.5-.7.7"></path>
					<path d="m8.5 15.5-.7.7"></path>
				</svg>
				{isLoadingCompanies ? (
					'Loading...'
				) : (
					<>
						Start New Scout
						{availableCompanies.length > 0 && ` (${availableCompanies.length})`}
					</>
				)}
			</button>

			{/* Scout Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
						<div className="flex justify-between items-center border-b border-slate-700 p-4">
							<h2 className="text-xl font-bold text-white">Start New Scout</h2>
							<button
								onClick={() => setIsModalOpen(false)}
								className="p-2 hover:bg-slate-700 rounded-full transition-colors"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<line x1="18" y1="6" x2="6" y2="18"></line>
									<line x1="6" y1="6" x2="18" y2="18"></line>
								</svg>
							</button>
						</div>

						<div className="p-4 flex-grow overflow-y-auto">
							<div className="mb-4">
								<p className="text-slate-300 mb-2">
									Select companies to scout for job openings:
								</p>
								<div className="flex gap-2">
									<button
										onClick={selectAllCompanies}
										className="text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded transition-colors"
									>
										Select All
									</button>
									<button
										onClick={clearSelection}
										className="text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded transition-colors"
									>
										Clear
									</button>
									<div className="ml-auto text-sm text-slate-400">
										{selectedCompanies.length} of {availableCompanies.length}{' '}
										selected
									</div>
								</div>
							</div>

							{availableCompanies.length === 0 ? (
								<div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 text-center">
									<p className="text-slate-300">
										No companies available for scouting right now.
									</p>
									<p className="text-slate-400 text-sm mt-1">
										Companies can be scouted once every{' '}
										{config.app.companyScrapeIntervalDays} days.
									</p>
								</div>
							) : (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
									{availableCompanies.map(company => (
										<div
											key={company.id}
											onClick={() => toggleCompanySelection(company.id)}
											className={`border p-3 rounded-lg cursor-pointer transition-colors ${
												selectedCompanies.includes(company.id)
													? 'border-purple-500 bg-purple-500/10'
													: 'border-slate-600 hover:border-slate-500'
											}`}
										>
											<div className="flex items-center justify-between">
												<div className="font-medium text-white">
													{company.company}
												</div>
												<div
													className={`h-5 w-5 rounded-full flex items-center justify-center border ${
														selectedCompanies.includes(company.id)
															? 'bg-purple-500 border-purple-500'
															: 'border-slate-500'
													}`}
												>
													{selectedCompanies.includes(company.companyID) && (
														<svg
															width="14"
															height="14"
															viewBox="0 0 24 24"
															fill="none"
															stroke="white"
															strokeWidth="3"
															strokeLinecap="round"
															strokeLinejoin="round"
														>
															<polyline points="20 6 9 17 4 12"></polyline>
														</svg>
													)}
												</div>
											</div>
											<div className="text-sm text-slate-400 mt-1">
												{company.lastSuccessfulScrape ? (
													<>
														Last scraped:{' '}
														{new Date(
															company.lastSuccessfulScrape,
														).toLocaleDateString()}
													</>
												) : (
													<>Never scraped</>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						<div className="border-t border-slate-700 p-4 flex justify-between">
							<button
								onClick={() => setIsModalOpen(false)}
								className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleScoutStart}
								disabled={selectedCompanies.length === 0 || isLoading}
								className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 transition-all
				  disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isLoading ? (
									<span className="flex items-center gap-2">
										<svg
											className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											></circle>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										Processing...
									</span>
								) : (
									<>Start Scouting ({selectedCompanies.length})</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
