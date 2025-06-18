'use client';

import React, {useState} from 'react';
import {WorkModel, CreateCompanyInput} from '@/types/company';

interface AddCompanyModalProps {
	isOpen: boolean;
	onClose: () => void;
	onAddCompany: (
		companyData: CreateCompanyInput,
		track: boolean,
		ranking: number,
	) => Promise<void>;
}

export function AddCompanyModal({
	isOpen,
	onClose,
	onAddCompany,
}: AddCompanyModalProps) {
	const [companyData, setCompanyData] = useState({
		companyID: '',
		company: '',
		careers_url: '',
		work_model: WorkModel.FULLY_REMOTE,
		headquarters: '',
		fields: '',
	});
	const [trackCompany, setTrackCompany] = useState(true);
	const [ranking, setRanking] = useState(75);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState('');

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		const {name, value} = e.target;
		setCompanyData(prev => ({...prev, [name]: value}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError('');

		try {
			// Format fields as an array
			const formattedData = {
				...companyData,
				fields: companyData.fields.split(',').map(field => field.trim()),
				office_locations: [],
				selector: '',
				openToApplication: true,
			};

			await onAddCompany(formattedData, trackCompany, ranking);
			onClose();
		} catch (err: any) {
			setError(err.message || 'Failed to add company');
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
			<div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
				<h2 className="text-2xl font-bold mb-4 text-[var(--text-color)]">
					Add New Company
				</h2>

				{error && (
					<div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit}>
					<div className="space-y-4">
						<div>
							<label
								htmlFor="companyID"
								className="block text-sm font-medium text-[var(--text-muted)] mb-1"
							>
								Company ID*
							</label>
							<input
								type="text"
								id="companyID"
								name="companyID"
								value={companyData.companyID}
								onChange={handleChange}
								required
								className="input w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-color)]"
								placeholder="e.g. acme_corp (no spaces, use underscore)"
							/>
							<p className="text-xs text-[var(--text-muted)] mt-1">
								Unique identifier, no spaces (use underscores instead)
							</p>
						</div>

						<div>
							<label
								htmlFor="company"
								className="block text-sm font-medium text-[var(--text-muted)] mb-1"
							>
								Company Name*
							</label>
							<input
								type="text"
								id="company"
								name="company"
								value={companyData.company}
								onChange={handleChange}
								required
								className="input w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-color)]"
								placeholder="e.g. Acme Corporation"
							/>
						</div>

						<div>
							<label
								htmlFor="careers_url"
								className="block text-sm font-medium text-[var(--text-muted)] mb-1"
							>
								Careers URL*
							</label>
							<input
								type="url"
								id="careers_url"
								name="careers_url"
								value={companyData.careers_url}
								onChange={handleChange}
								required
								className="input w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-color)]"
								placeholder="https://example.com/careers"
							/>
						</div>

						<div>
							<label
								htmlFor="work_model"
								className="block text-sm font-medium text-[var(--text-muted)] mb-1"
							>
								Work Model*
							</label>
							<select
								id="work_model"
								name="work_model"
								value={companyData.work_model}
								onChange={handleChange}
								required
								className="input w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-color)]"
							>
								<option value={WorkModel.FULLY_REMOTE}>Fully Remote</option>
								<option value={WorkModel.HYBRID}>Hybrid</option>
								<option value={WorkModel.IN_OFFICE}>On-Site</option>
							</select>
						</div>

						<div>
							<label
								htmlFor="headquarters"
								className="block text-sm font-medium text-[var(--text-muted)] mb-1"
							>
								Headquarters*
							</label>
							<input
								type="text"
								id="headquarters"
								name="headquarters"
								value={companyData.headquarters}
								onChange={handleChange}
								required
								className="input w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-color)]"
								placeholder="e.g. San Francisco, USA"
							/>
						</div>

						<div>
							<label
								htmlFor="fields"
								className="block text-sm font-medium text-[var(--text-muted)] mb-1"
							>
								Fields/Industries*
							</label>
							<textarea
								id="fields"
								name="fields"
								value={companyData.fields}
								onChange={handleChange}
								required
								className="input w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-color)]"
								placeholder="e.g. software development, cloud services, AI"
								rows={3}
							/>
							<p className="text-xs text-[var(--text-muted)] mt-1">
								Comma-separated list of fields or industries
							</p>
						</div>

						<div className="border-t border-[var(--card-border)] pt-4 mt-4">
							<div className="flex items-center mb-4">
								<input
									type="checkbox"
									id="trackCompany"
									checked={trackCompany}
									onChange={() => setTrackCompany(!trackCompany)}
									className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
								/>
								<label
									htmlFor="trackCompany"
									className="ml-2 block text-sm text-[var(--text-color)]"
								>
									Track this company
								</label>
							</div>

							{trackCompany && (
								<div>
									<label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
										Company Ranking: {ranking}
									</label>
									<input
										type="range"
										min="0"
										max="100"
										value={ranking}
										onChange={e => setRanking(parseInt(e.target.value))}
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
					</div>

					<div className="mt-6 flex items-center justify-end space-x-3">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
						>
							{isSubmitting ? 'Adding...' : 'Add Company'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
