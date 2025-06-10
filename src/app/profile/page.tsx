'use client';

import React, {useState} from 'react';

// --- TYPE DEFINITIONS ---

interface CurrentResidence {
	city: string;
	country: string;
	countryCode: string;
	timezone: string;
}

interface WorkAuthorization {
	region: string;
	regionCode: string;
	status: string;
}

interface Language {
	language: string;
	level: string;
}

interface Exclusions {
	industries: string[];
	technologies: string[];
	roleTypes: string[];
}

interface Preferences {
	careerGoals: string[];
	jobTypes: string[];
	workEnvironments: string[];
	companySizes: string[];
	exclusions: Exclusions;
}

interface Logistics {
	currentResidence: CurrentResidence;
	willingToRelocate: boolean;
	workAuthorization: WorkAuthorization[];
}

interface CandidateInfo {
	logistics: Logistics;
	languages: Language[];
	preferences: Preferences;
}

interface CandidateData {
	cvUrl: string;
	candidateInfo: CandidateInfo;
	credentials?: {
		gmail: string;
	};
	companyNames?: string[];
}

interface ArrayInputProps {
	label: string;
	items: string[];
	setItems: (items: string[]) => void;
	placeholder?: string;
}

interface FormSectionProps {
	logistics: Logistics;
	setLogistics: (logistics: Logistics) => void;
}

interface LanguagesFormProps {
	languages: Language[];
	setLanguages: (languages: Language[]) => void;
}

interface PreferencesFormProps {
	preferences: Preferences;
	setPreferences: (preferences: Preferences) => void;
}

interface CandidateFormProps {
	initialData: CandidateData;
	onFormSubmit: (data: CandidateData) => void;
}

// --- STYLING & ICONS (Shared across components) ---

const cardClasses =
	'bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-lg';
const labelClasses = 'block text-sm font-medium text-slate-300 mb-2';
const inputClasses =
	'block w-full bg-slate-700/50 border border-slate-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition';
const buttonClasses =
	'px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const primaryButtonClasses = `${buttonClasses} bg-purple-600 text-white hover:bg-purple-700 shadow-md`;
const secondaryButtonClasses = `${buttonClasses} bg-slate-600 hover:bg-slate-500 text-white`;
const removeButtonClasses = `${buttonClasses} bg-pink-600/80 hover:bg-pink-700 text-white text-xs py-1 px-2 flex items-center justify-center`;

const AddIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<line x1="12" y1="5" x2="12" y2="19"></line>
		<line x1="5" y1="12" x2="19" y2="12"></line>
	</svg>
);

const TrashIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="14"
		height="14"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<polyline points="3 6 5 6 21 6"></polyline>
		<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
		<line x1="10" y1="11" x2="10" y2="17"></line>
		<line x1="14" y1="11" x2="14" y2="17"></line>
	</svg>
);

// --- REUSABLE COMPONENTS ---

function ArrayInput({
	label,
	items,
	setItems,
	placeholder = '',
}: ArrayInputProps) {
	const [newItem, setNewItem] = useState('');

	const handleAddItem = () => {
		if (newItem.trim() !== '') {
			setItems([...items, newItem.trim()]);
			setNewItem('');
		}
	};

	const handleRemoveItem = (indexToRemove: number) => {
		setItems(items.filter((_, index) => index !== indexToRemove));
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleAddItem();
		}
	};

	return (
		<div>
			<label className={labelClasses}>{label}</label>
			<div className="space-y-2">
				{items.map((item, index) => (
					<div
						key={index}
						className="flex items-center gap-2 bg-slate-700/30 p-2 rounded-lg"
					>
						<span className="flex-grow text-slate-200 break-all">{item}</span>
						<button
							type="button"
							onClick={() => handleRemoveItem(index)}
							className={removeButtonClasses}
						>
							<TrashIcon />
						</button>
					</div>
				))}
			</div>
			<div className="flex gap-2 mt-2">
				<input
					type="text"
					value={newItem}
					onChange={e => setNewItem(e.target.value)}
					onKeyDown={handleKeyDown}
					className={inputClasses}
					placeholder={placeholder}
				/>
				<button
					type="button"
					onClick={handleAddItem}
					className={secondaryButtonClasses}
					disabled={!newItem.trim()}
				>
					<AddIcon />
				</button>
			</div>
		</div>
	);
}

// --- FORM SECTION COMPONENTS ---

function LogisticsForm({logistics, setLogistics}: FormSectionProps) {
	const handleResidenceChange = (
		field: keyof CurrentResidence,
		value: string,
	) => {
		setLogistics({
			...logistics,
			currentResidence: {...logistics.currentResidence, [field]: value},
		});
	};

	const handleAuthorizationChange = (
		index: number,
		field: keyof WorkAuthorization,
		value: string,
	) => {
		const updatedAuth = [...logistics.workAuthorization];
		updatedAuth[index] = {...updatedAuth[index], [field]: value};
		setLogistics({...logistics, workAuthorization: updatedAuth});
	};

	const addAuthorization = () => {
		setLogistics({
			...logistics,
			workAuthorization: [
				...logistics.workAuthorization,
				{region: '', regionCode: '', status: ''},
			],
		});
	};

	const removeAuthorization = (index: number) => {
		const filteredAuth = logistics.workAuthorization.filter(
			(_, i) => i !== index,
		);
		setLogistics({...logistics, workAuthorization: filteredAuth});
	};

	return (
		<div className={cardClasses}>
			<h3 className="text-xl font-bold mb-4 text-white">Logistics</h3>
			<div className="space-y-6">
				<div>
					<h4 className="font-semibold text-slate-200 mb-2">
						Current Residence
					</h4>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<input
							type="text"
							placeholder="City"
							value={logistics.currentResidence.city}
							onChange={e => handleResidenceChange('city', e.target.value)}
							className={inputClasses}
						/>
						<input
							type="text"
							placeholder="Country"
							value={logistics.currentResidence.country}
							onChange={e => handleResidenceChange('country', e.target.value)}
							className={inputClasses}
						/>
						<input
							type="text"
							placeholder="Country Code (e.g., NL)"
							value={logistics.currentResidence.countryCode}
							onChange={e =>
								handleResidenceChange('countryCode', e.target.value)
							}
							className={inputClasses}
						/>
						<input
							type="text"
							placeholder="Timezone (e.g., Europe/Amsterdam)"
							value={logistics.currentResidence.timezone}
							onChange={e => handleResidenceChange('timezone', e.target.value)}
							className={inputClasses}
						/>
					</div>
				</div>
				<div className="flex items-center gap-3 pt-2">
					<label
						htmlFor="willingToRelocate"
						className="font-medium text-slate-200"
					>
						Willing to relocate?
					</label>
					<input
						type="checkbox"
						id="willingToRelocate"
						checked={logistics.willingToRelocate}
						onChange={e =>
							setLogistics({...logistics, willingToRelocate: e.target.checked})
						}
						className="h-5 w-5 rounded bg-slate-700 border-slate-600 text-purple-500 focus:ring-purple-500"
					/>
				</div>
				<div>
					<h4 className="font-semibold text-slate-200 mb-2">
						Work Authorization
					</h4>
					<div className="space-y-3">
						{logistics.workAuthorization.map((auth, index) => (
							<div
								key={index}
								className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-slate-900/50 rounded-lg items-center"
							>
								<input
									type="text"
									placeholder="Region (e.g., European Union)"
									value={auth.region}
									onChange={e =>
										handleAuthorizationChange(index, 'region', e.target.value)
									}
									className={inputClasses}
								/>
								<input
									type="text"
									placeholder="Region Code (e.g., EU)"
									value={auth.regionCode}
									onChange={e =>
										handleAuthorizationChange(
											index,
											'regionCode',
											e.target.value,
										)
									}
									className={inputClasses}
								/>
								<input
									type="text"
									placeholder="Status (e.g., Citizen)"
									value={auth.status}
									onChange={e =>
										handleAuthorizationChange(index, 'status', e.target.value)
									}
									className={inputClasses}
								/>
								<button
									type="button"
									onClick={() => removeAuthorization(index)}
									className={removeButtonClasses + ' h-10'}
								>
									Remove
								</button>
							</div>
						))}
					</div>
					<button
						type="button"
						onClick={addAuthorization}
						className={secondaryButtonClasses + ' mt-3'}
					>
						Add Authorization
					</button>
				</div>
			</div>
		</div>
	);
}

function LanguagesForm({languages, setLanguages}: LanguagesFormProps) {
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
		<div className={cardClasses}>
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
							className={inputClasses}
						/>
						<input
							type="text"
							placeholder="Level (e.g., C1)"
							value={lang.level}
							onChange={e =>
								handleLanguageChange(index, 'level', e.target.value)
							}
							className={inputClasses}
						/>
						<button
							type="button"
							onClick={() => removeLanguage(index)}
							className={removeButtonClasses + ' h-10'}
						>
							Remove
						</button>
					</div>
				))}
			</div>
			<button
				type="button"
				onClick={addLanguage}
				className={secondaryButtonClasses + ' mt-3'}
			>
				Add Language
			</button>
		</div>
	);
}

function PreferencesForm({preferences, setPreferences}: PreferencesFormProps) {
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
		<div className={cardClasses}>
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

const DEFAULT_CANDIDATE_DATA = {
	cvUrl:
		'https://drive.google.com/file/d/1-0NUsEx0HmnTmcpMOjGSKdOJJ1Vd_uWL/view?usp=drive_link',
	candidateInfo: {
		logistics: {
			currentResidence: {
				city: 'Utrecht',
				country: 'Netherlands',
				countryCode: 'NL',
				timezone: 'Europe/Amsterdam',
			},
			willingToRelocate: true,
			workAuthorization: [
				{
					region: 'European Union',
					regionCode: 'EU',
					status: 'Citizen',
				},
			],
		},
		languages: [
			{language: 'Spanish', level: 'C2'},
			{language: 'English', level: 'C1'},
			{language: 'Dutch', level: 'B1'},
		],
		preferences: {
			careerGoals: [
				'Work with a modern tech stack like Next.js and Tailwind CSS',
				'Transition into a Senior Engineer role',
				'Contribute to a high-impact, user-facing product',
			],
			jobTypes: ['Full-time', 'Part-time'],
			workEnvironments: ['Remote', 'Hybrid'],
			companySizes: ['Start-ups', 'Mid-size (51-1000)', 'Large (1001+)'],
			exclusions: {
				industries: ['Gambling', 'Defense Contracting'],
				technologies: ['PHP', 'WordPress', 'jQuery'],
				roleTypes: [
					'100% on-call support',
					'Roles with heavy project management duties',
				],
			},
		},
	},
};

function CandidateForm({initialData, onFormSubmit}: CandidateFormProps) {
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

export default function ProfilePage() {
	const handleFormSubmit = (formData: CandidateData) => {
		const requestBody = {
			credentials: {
				// This will be replaced by the actual email from auth
				gmail: 'judithv.sanchezc@gmail.com',
			},
			companyNames: ['Booking'], // For now hardcoded to match example
			cvUrl: formData.cvUrl,
			candidateInfo: formData.candidateInfo,
		};

		console.log('--- Form Submitted ---');
		console.log('Final Request Body:', JSON.stringify(requestBody, null, 2));
		alert('Form data prepared! Check the console for the final request body.');
	};

	return (
		<div className="bg-slate-950 text-white min-h-screen">
			<div className="background-glows fixed inset-0 z-0"></div>
			<main className="relative z-10 max-w-4xl mx-auto pt-32 pb-24 px-4">
				<div className="text-center mb-8">
					<h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
						Create Your Candidate Profile
					</h1>
					<p className="text-slate-400">
						Fill out your details below to get personalized job matches.
					</p>
				</div>
				<CandidateForm
					initialData={DEFAULT_CANDIDATE_DATA}
					onFormSubmit={handleFormSubmit}
				/>
			</main>
		</div>
	);
}
