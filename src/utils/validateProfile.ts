type Profile = {
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
				region?: string;
				regionCode?: string;
				status?: string;
			}[];
		};
		languages?: {language?: string; level?: string}[];
		preferences?: {
			careerGoals?: string[];
			jobTypes?: string[];
			workEnvironments?: string[];
			companySizes?: string[];
			exclusions?: {
				industries?: string[];
				technologies?: string[];
				roleTypes?: string[];
			};
		};
	};
};

export function getProfileCompleteness(user: Profile): {
	isComplete: boolean;
	missing: string[];
} {
	const missing: string[] = [];

	if (
		!user.cvUrl ||
		typeof user.cvUrl !== 'string' ||
		user.cvUrl.trim() === ''
	) {
		missing.push('CV URL');
	}

	const info = user.candidateInfo;
	if (!info) {
		missing.push('Candidate Info');
	} else {
		const logistics = info.logistics;
		if (!logistics) {
			missing.push('Logistics');
		} else {
			const residence = logistics.currentResidence;
			if (!residence) {
				missing.push('Current Residence');
			} else {
				if (!residence.city) missing.push('City');
				if (!residence.country) missing.push('Country');
				if (!residence.countryCode) missing.push('Country Code');
				if (!residence.timezone) missing.push('Timezone');
			}
			if (typeof logistics.willingToRelocate !== 'boolean') {
				missing.push('Willing to Relocate');
			}
			if (
				!Array.isArray(logistics.workAuthorization) ||
				logistics.workAuthorization.length === 0
			) {
				missing.push('Work Authorization');
			} else {
				const wa = logistics.workAuthorization[0];
				if (!wa.region) missing.push('Work Authorization Region');
				if (!wa.regionCode) missing.push('Work Authorization Region Code');
				if (!wa.status) missing.push('Work Authorization Status');
			}
		}

		if (!Array.isArray(info.languages) || info.languages.length === 0) {
			missing.push('Languages');
		} else {
			const lang = info.languages[0];
			if (!lang.language) missing.push('Language');
			if (!lang.level) missing.push('Language Level');
		}

		const prefs = info.preferences;
		if (
			!prefs ||
			!Array.isArray(prefs.careerGoals) ||
			prefs.careerGoals.length === 0
		) {
			missing.push('Career Goals');
		}
	}

	return {
		isComplete: missing.length === 0,
		missing,
	};
}
