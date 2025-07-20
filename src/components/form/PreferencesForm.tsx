'use client';

import React from 'react';
import {PreferencesFormProps, Preferences, Exclusions} from './types';
import styles from './FormStyles.module.css';
import {ArrayInput} from './ArrayInput';

export function PreferencesForm({
	preferences,
	setPreferences,
}: PreferencesFormProps) {
	const handleArrayChange = (
		field: keyof Omit<Preferences, 'exclusions'>,
		value: string[],
	) => {
		setPreferences({...preferences, [field]: value});
	};

	const handleExclusionChange = (field: keyof Exclusions, value: string[]) => {
		setPreferences({
			...preferences,
			exclusions: {...preferences.exclusions, [field]: value},
		});
	};

	return (
		<div className={styles.card}>
			<h3 className="text-xl font-bold mb-4 text-white">Preferences</h3>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
				<ArrayInput
					label="Career Goals"
					items={preferences.careerGoals}
					setItems={v => handleArrayChange('careerGoals', v)}
					placeholder="e.g., Transition to senior role"
				/>
				<ArrayInput
					label="Job Types"
					items={preferences.jobTypes}
					setItems={v => handleArrayChange('jobTypes', v)}
					placeholder="e.g., Full-time"
				/>
				<ArrayInput
					label="Work Environments"
					items={preferences.workEnvironments}
					setItems={v => handleArrayChange('workEnvironments', v)}
					placeholder="e.g., Hybrid"
				/>
				<ArrayInput
					label="Company Sizes"
					items={preferences.companySizes}
					setItems={v => handleArrayChange('companySizes', v)}
					placeholder="e.g., Start-ups"
				/>

				<div className="md:col-span-2">
					<h4 className="text-lg font-semibold text-slate-200 mt-4 mb-2">
						Exclusions
					</h4>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-slate-900/50 rounded-lg">
						<ArrayInput
							label="Industries to Exclude"
							items={preferences.exclusions.industries}
							setItems={v => handleExclusionChange('industries', v)}
							placeholder="e.g., Gambling"
						/>
						<ArrayInput
							label="Technologies to Exclude"
							items={preferences.exclusions.technologies}
							setItems={v => handleExclusionChange('technologies', v)}
							placeholder="e.g., PHP"
						/>
						<ArrayInput
							label="Role Types to Exclude"
							items={preferences.exclusions.roleTypes}
							setItems={v => handleExclusionChange('roleTypes', v)}
							placeholder="e.g., 100% on-call"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
