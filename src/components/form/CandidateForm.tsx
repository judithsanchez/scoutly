'use client';

import React, {useState} from 'react';
import {LogisticsForm} from './LogisticsForm';
import {LanguagesForm} from './LanguagesForm';
import {PreferencesForm} from './PreferencesForm';
import {
	CandidateFormProps,
	cardClasses,
	labelClasses,
	inputClasses,
	primaryButtonClasses,
} from './types';

export function CandidateForm({initialData, onFormSubmit}: CandidateFormProps) {
	const [cvUrl, setCvUrl] = useState(initialData.cvUrl || '');
	const [logistics, setLogistics] = useState(
		initialData.candidateInfo.logistics || {},
	);
	const [languages, setLanguages] = useState(
		initialData.candidateInfo.languages || [],
	);
	const [preferences, setPreferences] = useState(
		initialData.candidateInfo.preferences || {},
	);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const candidateInfo = {
			logistics,
			languages,
			preferences,
		};
		onFormSubmit({cvUrl, candidateInfo});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className={cardClasses}>
				<label htmlFor="cvUrl" className={labelClasses}>
					CV URL
				</label>
				<input
					id="cvUrl"
					type="url"
					value={cvUrl}
					onChange={e => setCvUrl(e.target.value)}
					className={inputClasses}
					placeholder="https://drive.google.com/..."
					required
				/>
			</div>

			<LogisticsForm logistics={logistics} setLogistics={setLogistics} />
			<LanguagesForm languages={languages} setLanguages={setLanguages} />
			<PreferencesForm
				preferences={preferences}
				setPreferences={setPreferences}
			/>

			<div className="pt-4 flex justify-end">
				<button
					type="submit"
					className={primaryButtonClasses + ' py-3 px-6 text-base'}
				>
					Generate Profile & Find Jobs
				</button>
			</div>
		</form>
	);
}
