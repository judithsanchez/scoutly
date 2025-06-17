'use client';

import React, {useState, useEffect} from 'react';
import {ArrayInput} from '@/components/form/ArrayInput';

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

// --- STYLING ---
const cardClasses =
	'bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 shadow-lg';
const labelClasses = 'block text-sm font-medium text-[var(--text-muted)] mb-2';
const inputClasses =
	'block w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg py-2 px-3 text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-purple-500 transition';
const buttonClasses =
	'px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const secondaryButtonClasses = `${buttonClasses} bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover-bg)] text-[var(--btn-secondary-text)]`;
const removeButtonClasses = `${buttonClasses} bg-pink-600/80 hover:bg-pink-700 text-white text-xs py-1 px-2 flex items-center justify-center`;
const primaryButtonClasses = `${buttonClasses} bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover-bg)] shadow-md`;

// Default data
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

export default function ProfilePage() {
	// Mock authenticated user
	const authInfo = {
		gmail: 'judithv.sanchezc@gmail.com',
	};

	// State for profile form
	const [cvUrl, setCvUrl] = useState(DEFAULT_CANDIDATE_DATA.cvUrl);
	const [logistics, setLogistics] = useState(
		DEFAULT_CANDIDATE_DATA.candidateInfo.logistics,
	);
	const [languages, setLanguages] = useState(
		DEFAULT_CANDIDATE_DATA.candidateInfo.languages,
	);
	const [preferences, setPreferences] = useState(
		DEFAULT_CANDIDATE_DATA.candidateInfo.preferences,
	);
	const [isSaving, setIsSaving] = useState(false);
	const [saveMessage, setSaveMessage] = useState<string | null>(null);

	const handleSaveProfile = async () => {
		setIsSaving(true);
		setSaveMessage(null);

		try {
			// Here you would typically save to your API
			// For now, we'll just simulate a save
			await new Promise(resolve => setTimeout(resolve, 1000));

			setSaveMessage('Profile saved successfully!');
			setTimeout(() => setSaveMessage(null), 3000);
		} catch (error) {
			setSaveMessage('Failed to save profile. Please try again.');
			setTimeout(() => setSaveMessage(null), 3000);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="bg-[var(--page-bg)] text-[var(--text-color)] min-h-screen">
			<div className="background-glows fixed inset-0 z-0"></div>
			<main className="relative z-10 max-w-4xl mx-auto pt-32 pb-24 px-4">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-[var(--text-color)] mb-2">
						Profile Settings
					</h1>
					<p className="text-[var(--text-muted)]">
						Manage your profile information and job preferences
					</p>
				</div>

				{/* Auth Info Section */}
				<div className="mb-8 p-6 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]">
					<div className="flex justify-between items-center">
						<div>
							<h2 className="text-lg font-medium text-[var(--text-color)]">
								Current Session
							</h2>
							<p className="text-purple-400 font-medium mt-1">
								{authInfo.gmail}
							</p>
						</div>
						<div className="flex gap-3">
							<button
								onClick={handleSaveProfile}
								disabled={isSaving}
								className={primaryButtonClasses}
							>
								{isSaving ? 'Saving...' : 'Save Profile'}
							</button>
							<a href="/dashboard" className={secondaryButtonClasses}>
								Back to Dashboard
							</a>
						</div>
					</div>
					{saveMessage && (
						<div
							className={`mt-3 p-3 rounded-lg text-sm ${
								saveMessage.includes('successfully')
									? 'bg-green-900/50 text-green-300 border border-green-700'
									: 'bg-red-900/50 text-red-300 border border-red-700'
							}`}
						>
							{saveMessage}
						</div>
					)}
				</div>

				{/* Profile Form */}
				<div className="space-y-6">
					{/* CV URL */}
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

					{/* Logistics */}
					<div className={cardClasses}>
						<h3 className="text-lg font-bold text-[var(--text-color)] mb-4">
							Logistics
						</h3>
						<div className="space-y-6">
							<div>
								<h4 className="font-semibold text-[var(--text-color)] mb-2">
									Current Residence
								</h4>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<input
										type="text"
										placeholder="City"
										value={logistics.currentResidence.city}
										onChange={e =>
											setLogistics({
												...logistics,
												currentResidence: {
													...logistics.currentResidence,
													city: e.target.value,
												},
											})
										}
										className={inputClasses}
									/>
									<input
										type="text"
										placeholder="Country"
										value={logistics.currentResidence.country}
										onChange={e =>
											setLogistics({
												...logistics,
												currentResidence: {
													...logistics.currentResidence,
													country: e.target.value,
												},
											})
										}
										className={inputClasses}
									/>
									<input
										type="text"
										placeholder="Country Code (e.g., NL)"
										value={logistics.currentResidence.countryCode}
										onChange={e =>
											setLogistics({
												...logistics,
												currentResidence: {
													...logistics.currentResidence,
													countryCode: e.target.value,
												},
											})
										}
										className={inputClasses}
									/>
									<input
										type="text"
										placeholder="Timezone (e.g., Europe/Amsterdam)"
										value={logistics.currentResidence.timezone}
										onChange={e =>
											setLogistics({
												...logistics,
												currentResidence: {
													...logistics.currentResidence,
													timezone: e.target.value,
												},
											})
										}
										className={inputClasses}
									/>
								</div>
							</div>

							<div className="flex items-center gap-3 pt-2">
								<label
									htmlFor="willingToRelocate"
									className="font-medium text-[var(--text-color)]"
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
									className="h-5 w-5 rounded bg-[var(--input-bg)] border-[var(--input-border)] text-purple-500 focus:ring-purple-500"
								/>
							</div>

							<div>
								<h4 className="font-semibold text-[var(--text-color)] mb-2">
									Work Authorization
								</h4>
								{logistics.workAuthorization.map((auth, index) => (
									<div
										key={index}
										className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-[var(--card-bg-secondary)] rounded-lg items-center"
									>
										<input
											type="text"
											placeholder="Region (e.g., European Union)"
											value={auth.region}
											onChange={e => {
												const updatedAuth = [...logistics.workAuthorization];
												updatedAuth[index] = {
													...auth,
													region: e.target.value,
												};
												setLogistics({
													...logistics,
													workAuthorization: updatedAuth,
												});
											}}
											className={inputClasses}
										/>
										<input
											type="text"
											placeholder="Region Code (e.g., EU)"
											value={auth.regionCode}
											onChange={e => {
												const updatedAuth = [...logistics.workAuthorization];
												updatedAuth[index] = {
													...auth,
													regionCode: e.target.value,
												};
												setLogistics({
													...logistics,
													workAuthorization: updatedAuth,
												});
											}}
											className={inputClasses}
										/>
										<input
											type="text"
											placeholder="Status (e.g., Citizen)"
											value={auth.status}
											onChange={e => {
												const updatedAuth = [...logistics.workAuthorization];
												updatedAuth[index] = {
													...auth,
													status: e.target.value,
												};
												setLogistics({
													...logistics,
													workAuthorization: updatedAuth,
												});
											}}
											className={inputClasses}
										/>
										<button
											type="button"
											onClick={() => {
												const filteredAuth =
													logistics.workAuthorization.filter(
														(_, i) => i !== index,
													);
												setLogistics({
													...logistics,
													workAuthorization: filteredAuth,
												});
											}}
											className={removeButtonClasses + ' h-10'}
										>
											Remove
										</button>
									</div>
								))}
								<button
									type="button"
									onClick={() => {
										setLogistics({
											...logistics,
											workAuthorization: [
												...logistics.workAuthorization,
												{region: '', regionCode: '', status: ''},
											],
										});
									}}
									className={secondaryButtonClasses + ' mt-3'}
								>
									Add Authorization
								</button>
							</div>
						</div>
					</div>

					{/* Languages */}
					<div className={cardClasses}>
						<h3 className="text-lg font-bold text-[var(--text-color)] mb-4">Languages</h3>
						<div className="space-y-3">
							{languages.map((lang, index) => (
								<div
									key={index}
									className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-[var(--card-bg-secondary)] rounded-lg items-center"
								>
									<input
										type="text"
										placeholder="Language (e.g., English)"
										value={lang.language}
										onChange={e => {
											const updatedLanguages = [...languages];
											updatedLanguages[index] = {
												...lang,
												language: e.target.value,
											};
											setLanguages(updatedLanguages);
										}}
										className={inputClasses}
									/>
									<input
										type="text"
										placeholder="Level (e.g., C1)"
										value={lang.level}
										onChange={e => {
											const updatedLanguages = [...languages];
											updatedLanguages[index] = {
												...lang,
												level: e.target.value,
											};
											setLanguages(updatedLanguages);
										}}
										className={inputClasses}
									/>
									<button
										type="button"
										onClick={() => {
											setLanguages(languages.filter((_, i) => i !== index));
										}}
										className={removeButtonClasses + ' h-10'}
									>
										Remove
									</button>
								</div>
							))}
						</div>
						<button
							type="button"
							onClick={() => {
								setLanguages([...languages, {language: '', level: ''}]);
							}}
							className={secondaryButtonClasses + ' mt-3'}
						>
							Add Language
						</button>
					</div>

					{/* Preferences */}
					<div className={cardClasses}>
						<h3 className="text-lg font-bold text-[var(--text-color)] mb-4">Preferences</h3>
						<div className="space-y-6">
							<ArrayInput
								label="Career Goals"
								items={preferences.careerGoals}
								setItems={(v: string[]) =>
									setPreferences({...preferences, careerGoals: v})
								}
								placeholder="e.g., Transition to senior role"
							/>
							<ArrayInput
								label="Job Types"
								items={preferences.jobTypes}
								setItems={(v: string[]) =>
									setPreferences({...preferences, jobTypes: v})
								}
								placeholder="e.g., Full-time"
							/>
							<ArrayInput
								label="Work Environments"
								items={preferences.workEnvironments}
								setItems={(v: string[]) =>
									setPreferences({...preferences, workEnvironments: v})
								}
								placeholder="e.g., Hybrid"
							/>
							<ArrayInput
								label="Company Sizes"
								items={preferences.companySizes}
								setItems={(v: string[]) =>
									setPreferences({...preferences, companySizes: v})
								}
								placeholder="e.g., Start-ups"
							/>

							<div className="md:col-span-2">
								<h4 className="text-lg font-semibold text-[var(--text-color)] mt-4 mb-2">
									Exclusions
								</h4>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-[var(--card-bg-secondary)] rounded-lg">
									<ArrayInput
										label="Industries to Exclude"
										items={preferences.exclusions.industries}
										setItems={(v: string[]) =>
											setPreferences({
												...preferences,
												exclusions: {
													...preferences.exclusions,
													industries: v,
												},
											})
										}
										placeholder="e.g., Gambling"
									/>
									<ArrayInput
										label="Technologies to Exclude"
										items={preferences.exclusions.technologies}
										setItems={(v: string[]) =>
											setPreferences({
												...preferences,
												exclusions: {
													...preferences.exclusions,
													technologies: v,
												},
											})
										}
										placeholder="e.g., PHP"
									/>
									<ArrayInput
										label="Role Types to Exclude"
										items={preferences.exclusions.roleTypes}
										setItems={(v: string[]) =>
											setPreferences({
												...preferences,
												exclusions: {
													...preferences.exclusions,
													roleTypes: v,
												},
											})
										}
										placeholder="e.g., 100% on-call"
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Save Button at Bottom */}
					<div className="flex justify-center pt-6">
						<button
							onClick={handleSaveProfile}
							disabled={isSaving}
							className={`${primaryButtonClasses} px-8 py-3 text-base`}
						>
							{isSaving ? 'Saving Profile...' : 'Save Profile'}
						</button>
					</div>
				</div>
			</main>
		</div>
	);
}
