'use client';

import React, {useState} from 'react';
import {WorkModel, CreateCompanyInput} from '@/types/company';
import styles from './AddCompanyModal.module.css';

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
		<div className={styles.modalOverlay}>
			<div className={styles.modalContainer}>
				<h2 className={styles.modalTitle}>Add New Company</h2>

				{error && <div className={styles.errorBox}>{error}</div>}

				<form onSubmit={handleSubmit}>
					<div>
						<div className={styles.formGroup}>
							<label htmlFor="companyID" className={styles.label}>
								Company ID*
							</label>
							<input
								type="text"
								id="companyID"
								name="companyID"
								value={companyData.companyID}
								onChange={handleChange}
								required
								className={styles.input}
								placeholder="e.g. acme_corp (no spaces, use underscore)"
							/>
							<p className={styles.helperText}>
								Unique identifier, no spaces (use underscores instead)
							</p>
						</div>

						<div className={styles.formGroup}>
							<label htmlFor="company" className={styles.label}>
								Company Name*
							</label>
							<input
								type="text"
								id="company"
								name="company"
								value={companyData.company}
								onChange={handleChange}
								required
								className={styles.input}
								placeholder="e.g. Acme Corporation"
							/>
						</div>

						<div className={styles.formGroup}>
							<label htmlFor="careers_url" className={styles.label}>
								Careers URL*
							</label>
							<input
								type="url"
								id="careers_url"
								name="careers_url"
								value={companyData.careers_url}
								onChange={handleChange}
								required
								className={styles.input}
								placeholder="https://example.com/careers"
							/>
						</div>

						<div className={styles.formGroup}>
							<label htmlFor="work_model" className={styles.label}>
								Work Model*
							</label>
							<select
								id="work_model"
								name="work_model"
								value={companyData.work_model}
								onChange={handleChange}
								required
								className={styles.select}
							>
								<option value={WorkModel.FULLY_REMOTE}>Fully Remote</option>
								<option value={WorkModel.HYBRID}>Hybrid</option>
								<option value={WorkModel.IN_OFFICE}>On-Site</option>
							</select>
						</div>

						<div className={styles.formGroup}>
							<label htmlFor="headquarters" className={styles.label}>
								Headquarters*
							</label>
							<input
								type="text"
								id="headquarters"
								name="headquarters"
								value={companyData.headquarters}
								onChange={handleChange}
								required
								className={styles.input}
								placeholder="e.g. San Francisco, USA"
							/>
						</div>

						<div className={styles.formGroup}>
							<label htmlFor="fields" className={styles.label}>
								Fields/Industries*
							</label>
							<textarea
								id="fields"
								name="fields"
								value={companyData.fields}
								onChange={handleChange}
								required
								className={styles.textarea}
								placeholder="e.g. software development, cloud services, AI"
								rows={3}
							/>
							<p className={styles.helperText}>
								Comma-separated list of fields or industries
							</p>
						</div>

						<div className={styles.divider}>
							<div className={styles.checkboxRow}>
								<input
									type="checkbox"
									id="trackCompany"
									checked={trackCompany}
									onChange={() => setTrackCompany(!trackCompany)}
									className={styles.checkboxInput}
								/>
								<label htmlFor="trackCompany" className={styles.checkboxLabel}>
									Track this company
								</label>
							</div>

							{trackCompany && (
								<div>
									<label className={styles.sliderLabel}>
										Company Ranking: {ranking}
									</label>
									<input
										type="range"
										min="0"
										max="100"
										value={ranking}
										onChange={e => setRanking(parseInt(e.target.value))}
										className={styles.slider}
									/>
									<div className={styles.sliderMarks}>
										<span>0</span>
										<span>50</span>
										<span>100</span>
									</div>
								</div>
							)}
						</div>
					</div>

					<div className={styles.actions}>
						<button
							type="button"
							onClick={onClose}
							className={`${styles.button} ${styles.buttonSecondary}`}
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className={`${styles.button} ${styles.buttonPrimary}`}
						>
							{isSubmitting ? 'Adding...' : 'Add Company'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
