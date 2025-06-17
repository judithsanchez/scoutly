'use client';

import {useState} from 'react';

interface SearchModalProps {
	isOpen: boolean;
	onClose: () => void;
	requestBody: any;
	onSearchComplete?: (success: boolean, totalJobs: number) => void;
}

export function SearchModal({
	isOpen,
	onClose,
	requestBody,
	onSearchComplete,
}: SearchModalProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [results, setResults] = useState<{
		message: string;
		error?: boolean;
		totalJobs?: number;
	} | null>(null);

	if (!isOpen) return null;

	const handleStartSearch = async () => {
		try {
			setIsLoading(true);
			setResults(null);

			const response = await fetch('/api/jobs', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(
					data.error || 'An error occurred while searching for jobs',
				);
			}

			// Calculate total jobs found across all companies
			const totalJobs = data.results.reduce((acc: number, company: any) => {
				return acc + (company.processed ? company.results.length : 0);
			}, 0);

			setResults({
				message:
					totalJobs > 0
						? `Found ${totalJobs} new positions!`
						: 'No new positions found.',
				error: false,
				totalJobs,
			});

			// Notify parent component that search completed successfully
			if (onSearchComplete) {
				onSearchComplete(true, totalJobs);
			}
		} catch (error: any) {
			setResults({
				message: error.message || 'An error occurred while searching for jobs',
				error: true,
			});

			// Notify parent component that search failed
			if (onSearchComplete) {
				onSearchComplete(false, 0);
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
			onClick={e => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div className="w-full max-w-2xl bg-slate-900 rounded-2xl shadow-xl p-6">
				<div className="text-center mb-6">
					<h2 className="text-2xl font-bold mb-2">Confirm Search</h2>
					<p className="text-slate-400">
						Review the search parameters and click Start Search to proceed
					</p>
				</div>

				{/* Request Body */}
				<div className="mb-6">
					<div className="bg-slate-800 rounded-lg p-4 overflow-auto max-h-[300px]">
						<pre className="text-sm text-slate-300 whitespace-pre-wrap break-words">
							{JSON.stringify(requestBody, null, 2)}
						</pre>
					</div>
				</div>

				{/* Loading State */}
				{isLoading && (
					<div className="text-center mb-6">
						<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
						<p className="mt-2 text-slate-300">Searching for positions...</p>
					</div>
				)}

				{/* Results */}
				{results && (
					<div
						className={`text-center mb-6 ${
							results.error ? 'text-red-400' : 'text-green-400'
						}`}
					>
						<p className="font-medium">{results.message}</p>
					</div>
				)}

				{/* Actions */}
				<div className="flex justify-end gap-3">
					<button
						onClick={onClose}
						className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
					>
						Close
					</button>
					{!isLoading && !results && (
						<button
							onClick={handleStartSearch}
							className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
						>
							Start Search
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
