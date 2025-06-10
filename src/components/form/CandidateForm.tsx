'use client';

import React, {useState} from 'react';
import {LogisticsForm} from './LogisticsForm';
import {LanguagesForm} from './LanguagesForm';
import {PreferencesForm} from './PreferencesForm';

// Shared styling constants
const cardClasses =
	'bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-lg';
const labelClasses = 'block text-sm font-medium text-slate-300 mb-2';
const inputClasses =
	'block w-full bg-slate-700/50 border border-slate-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition';
const buttonClasses =
	'px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const primaryButtonClasses = `${buttonClasses} bg-purple-600 text-white hover:bg-purple-700 shadow-md`;

interface CandidateFormProps {
	initialData: any;
	onFormSubmit: (data: any) => void;
}

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
