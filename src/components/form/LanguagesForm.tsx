'use client';

import React from 'react';
import {LanguagesFormProps, Language} from './types';
import styles from './FormStyles.module.css';

export function LanguagesForm({languages, setLanguages}: LanguagesFormProps) {
	const handleLanguageChange = (
		index: number,
		field: keyof Language,
		value: string,
	) => {
		const updatedLanguages = [...languages];
		updatedLanguages[index] = {...updatedLanguages[index], [field]: value};
		setLanguages(updatedLanguages);
	};

	const addLanguage = () => {
		setLanguages([...languages, {language: '', level: ''}]);
	};

	const removeLanguage = (index: number) => {
		setLanguages(languages.filter((_, i) => i !== index));
	};

	return (
		<div className={styles.card}>
			<h3 className="text-xl font-bold mb-4 text-white">Languages</h3>
			<div className="space-y-3">
				{languages.map((lang, index) => (
					<div
						key={index}
						className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-900/50 rounded-lg items-center"
					>
						<input
							type="text"
							placeholder="Language (e.g., English)"
							value={lang.language}
							onChange={e =>
								handleLanguageChange(index, 'language', e.target.value)
							}
							className={styles.input}
						/>
						<input
							type="text"
							placeholder="Level (e.g., C1)"
							value={lang.level}
							onChange={e =>
								handleLanguageChange(index, 'level', e.target.value)
							}
							className={styles.input}
						/>
						<button
							type="button"
							onClick={() => removeLanguage(index)}
							className={`${styles.removeButton} h-10`}
						>
							Remove
						</button>
					</div>
				))}
			</div>
			<button
				type="button"
				onClick={addLanguage}
				className={`${styles.secondaryButton} mt-3`}
			>
				Add Language
			</button>
		</div>
	);
}
