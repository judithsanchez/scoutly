'use client';

import React, {useState, useEffect} from 'react';
import {ArrayInput} from '@/components/form/ArrayInput';
import {
	PAGE_CONTENT_CONTAINER,
	PAGE_BACKGROUND_CONTAINER,
	PAGE_BACKGROUND_GLOW,
} from '@/constants/styles';
import {
	ProfileCard,
	PageHeader,
	AuthInfoSection,
	SectionHeading,
	FormField,
	SaveButton,
	AddButton,
	CheckboxField,
	LanguageItem,
	WorkAuthorizationItem,
} from '@/components/profile/ProfileComponents';

import {Language} from '@/components/form/types';
import {useProfile} from '@/hooks/useProfile';

export default function ProfilePage() {
	const {
		profile,
		loading,
		error,
		saveProfile,
		saveMessage,
		isSaving,
		missingFields,
		isProfileComplete,
		refetch,
	} = useProfile();

	// Local state for form fields, initialized from profile
	const [cvUrl, setCvUrl] = useState('');
	const [logistics, setLogistics] = useState({
		currentResidence: {city: '', country: '', countryCode: '', timezone: ''},
		willingToRelocate: false,
		workAuthorization: [{region: '', regionCode: '', status: ''}],
	});
	const [languages, setLanguages] = useState<Language[]>([
		{language: '', level: ''},
	]);
	const [preferences, setPreferences] = useState({
		careerGoals: [''],
		jobTypes: [''],
		workEnvironments: [''],
		companySizes: [''],
		exclusions: {industries: [''], technologies: [''], roleTypes: ['']},
	});

	// Sync local state with profile data
	useEffect(() => {
		if (profile) {
			setCvUrl(profile.cvUrl || '');
			if (profile.candidateInfo) {
				const logisticsData = profile.candidateInfo.logistics || {};
				setLogistics({
					currentResidence: {
						city: logisticsData.currentResidence?.city ?? '',
						country: logisticsData.currentResidence?.country ?? '',
						countryCode: logisticsData.currentResidence?.countryCode ?? '',
						timezone: logisticsData.currentResidence?.timezone ?? '',
					},
					willingToRelocate: logisticsData.willingToRelocate || false,
					workAuthorization: logisticsData.workAuthorization || [
						{region: '', regionCode: '', status: ''},
					],
				});
				setLanguages(
					profile.candidateInfo.languages || [{language: '', level: ''}],
				);
				setPreferences(
					profile.candidateInfo.preferences || {
						careerGoals: [''],
						jobTypes: [''],
						workEnvironments: [''],
						companySizes: [''],
						exclusions: {industries: [''], technologies: [''], roleTypes: ['']},
					},
				);
			}
		}
	}, [profile]);

	const handleSaveProfile = async () => {
		await saveProfile(cvUrl, logistics, languages, preferences);
	};

	return (
		<div className={PAGE_BACKGROUND_CONTAINER}>
			<div className={PAGE_BACKGROUND_GLOW} />
			<main className={PAGE_CONTENT_CONTAINER}>
				<PageHeader
					title="Profile Settings"
					description="Manage your profile information and job preferences"
				/>

				{!isProfileComplete && (
					<div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
						<strong>Profile incomplete!</strong>
						<div>
							Please fill all required fields:
							<ul className="list-disc ml-6">
								{missingFields.map((field: string) => (
									<li key={field}>{field}</li>
								))}
							</ul>
						</div>
					</div>
				)}

				<AuthInfoSection
					email=""
					onSave={handleSaveProfile}
					isSaving={isSaving}
					saveMessage={saveMessage}
				/>

				<div className="space-y-6">
					<ProfileCard>
						<FormField
							id="cvUrl"
							label="CV URL"
							type="url"
							value={cvUrl}
							onChange={e => setCvUrl(e.target.value)}
							placeholder="https://drive.google.com/..."
							required
						/>
					</ProfileCard>

					<ProfileCard title="Logistics">
						<div className="space-y-6">
							<div>
								<SectionHeading title="Current Residence" />
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<FormField
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
									/>
									<FormField
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
									/>
									<FormField
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
									/>
									<FormField
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
									/>
								</div>
							</div>

							<CheckboxField
								id="willingToRelocate"
								label="Willing to relocate?"
								checked={logistics.willingToRelocate}
								onChange={e =>
									setLogistics({
										...logistics,
										willingToRelocate: e.target.checked,
									})
								}
							/>

							<div>
								<SectionHeading title="Work Authorization" />
								{logistics.workAuthorization.map((auth, index) => (
									<WorkAuthorizationItem
										key={index}
										region={auth.region}
										regionCode={auth.regionCode}
										status={auth.status}
										onRegionChange={value => {
											const updatedAuth = [...logistics.workAuthorization];
											updatedAuth[index] = {
												...auth,
												region: value,
											};
											setLogistics({
												...logistics,
												workAuthorization: updatedAuth,
											});
										}}
										onRegionCodeChange={value => {
											const updatedAuth = [...logistics.workAuthorization];
											updatedAuth[index] = {
												...auth,
												regionCode: value,
											};
											setLogistics({
												...logistics,
												workAuthorization: updatedAuth,
											});
										}}
										onStatusChange={value => {
											const updatedAuth = [...logistics.workAuthorization];
											updatedAuth[index] = {
												...auth,
												status: value,
											};
											setLogistics({
												...logistics,
												workAuthorization: updatedAuth,
											});
										}}
										onRemove={() => {
											const filteredAuth = logistics.workAuthorization.filter(
												(_, i) => i !== index,
											);
											setLogistics({
												...logistics,
												workAuthorization: filteredAuth,
											});
										}}
									/>
								))}
								<AddButton
									onClick={() => {
										setLogistics({
											...logistics,
											workAuthorization: [
												...logistics.workAuthorization,
												{region: '', regionCode: '', status: ''},
											],
										});
									}}
									label="Add Authorization"
								/>
							</div>
						</div>
					</ProfileCard>

					<ProfileCard title="Languages">
						<div className="space-y-3">
							{languages.map((lang, index) => (
								<LanguageItem
									key={index}
									language={lang.language}
									level={lang.level}
									onLanguageChange={value => {
										const updatedLanguages = [...languages];
										updatedLanguages[index] = {
											...lang,
											language: value,
										};
										setLanguages(updatedLanguages);
									}}
									onLevelChange={value => {
										const updatedLanguages = [...languages];
										updatedLanguages[index] = {
											...lang,
											level: value,
										};
										setLanguages(updatedLanguages);
									}}
									onRemove={() => {
										setLanguages(languages.filter((_, i) => i !== index));
									}}
								/>
							))}
						</div>
						<AddButton
							onClick={() => {
								setLanguages([...languages, {language: '', level: ''}]);
							}}
							label="Add Language"
						/>
					</ProfileCard>

					<ProfileCard title="Preferences">
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
								<SectionHeading title="Exclusions" />
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
					</ProfileCard>

					<div className="flex justify-center pt-6">
						<SaveButton
							onClick={handleSaveProfile}
							disabled={isSaving || !isProfileComplete}
							large={true}
						/>
					</div>
				</div>
			</main>
		</div>
	);
}
