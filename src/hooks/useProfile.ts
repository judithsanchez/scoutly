import {useState, useCallback, useEffect} from 'react';
import apiClient from '@/lib/apiClient';
import {endpoint} from '@/constants/apiEndpoints';
import {getProfileCompleteness} from '@/utils/validateProfile';

export type ProfileResponse = {
	cvUrl?: string;
	candidateInfo?: {
		logistics?: {
			currentResidence?: {
				city?: string;
				country?: string;
				countryCode?: string;
				timezone?: string;
			};
			willingToRelocate?: boolean;
			workAuthorization?: {
				region: string;
				regionCode: string;
				status: string;
			}[];
		};
		languages?: {language: string; level: string}[];
		preferences?: {
			careerGoals: string[];
			jobTypes: string[];
			workEnvironments: string[];
			companySizes: string[];
			exclusions: {
				industries: string[];
				technologies: string[];
				roleTypes: string[];
			};
		};
	};
};

export function useProfile() {
	const [profile, setProfile] = useState<ProfileResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saveMessage, setSaveMessage] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [missingFields, setMissingFields] = useState<string[]>([]);
	const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);

	const fetchProfile = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await apiClient<ProfileResponse>(endpoint.users.profile);
			setProfile(data);
			const user = (data as any).user || data;
			const completeness = getProfileCompleteness({
				cvUrl: user.cvUrl,
				candidateInfo: user.candidateInfo,
			});
			setMissingFields(completeness.missing);
			setIsProfileComplete(completeness.isComplete);
		} catch (err: any) {
			setError(err?.message || 'Failed to fetch profile');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchProfile();
	}, [fetchProfile]);

	const saveProfile = useCallback(
		async (cvUrl: string, logistics: any, languages: any, preferences: any) => {
			setIsSaving(true);
			setSaveMessage(null);
			const completeness = getProfileCompleteness({
				cvUrl,
				candidateInfo: {logistics, languages, preferences},
			});
			setMissingFields(completeness.missing);
			setIsProfileComplete(completeness.isComplete);
			if (!completeness.isComplete) {
				setSaveMessage(
					'Profile incomplete. Please fill all required fields: ' +
						completeness.missing.join(', '),
				);
				setIsSaving(false);
				return false;
			}
			try {
				await apiClient(endpoint.users.profile, {
					method: 'PATCH',
					body: JSON.stringify({
						cvUrl,
						candidateInfo: {logistics, languages, preferences},
					}),
				});
				setSaveMessage('Profile saved successfully!');
				setTimeout(() => setSaveMessage(null), 3000);
				fetchProfile();
				return true;
			} catch (err: any) {
				const errorMsg = err?.message || 'Unknown error';
				setSaveMessage('Failed to save profile: ' + errorMsg);
				setTimeout(() => setSaveMessage(null), 3000);
				setIsSaving(false);
				return false;
			} finally {
				setIsSaving(false);
			}
		},
		[fetchProfile],
	);

	return {
		profile,
		loading,
		error,
		saveProfile,
		saveMessage,
		isSaving,
		missingFields,
		isProfileComplete,
		refetch: fetchProfile,
	};
}
