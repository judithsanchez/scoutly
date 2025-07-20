export interface CurrentResidence {
	city: string;
	country: string;
	countryCode: string;
	timezone: string;
}

export interface WorkAuthorization {
	region: string;
	regionCode: string;
	status: string;
}

export interface Language {
	language: string;
	level: string;
}

export interface Exclusions {
	industries: string[];
	technologies: string[];
	roleTypes: string[];
}

export interface Preferences {
	careerGoals: string[];
	jobTypes: string[];
	workEnvironments: string[];
	companySizes: string[];
	exclusions: Exclusions;
}

export interface Logistics {
	currentResidence: CurrentResidence;
	willingToRelocate: boolean;
	workAuthorization: WorkAuthorization[];
}

export interface CandidateInfo {
	logistics: Logistics;
	languages: Language[];
	preferences: Preferences;
}

export interface CandidateData {
	cvUrl: string;
	candidateInfo: CandidateInfo;
	credentials?: {
		gmail: string;
	};
	companyIds?: string[];
}

export interface ArrayInputProps {
	label: string;
	items: string[];
	setItems: (items: string[]) => void;
	placeholder?: string;
}

export interface FormSectionProps {
	logistics: Logistics;
	setLogistics: (logistics: Logistics) => void;
}

export interface LanguagesFormProps {
	languages: Language[];
	setLanguages: (languages: Language[]) => void;
}

export interface PreferencesFormProps {
	preferences: Preferences;
	setPreferences: (preferences: Preferences) => void;
}

export interface CandidateFormProps {
	initialData: CandidateData;
	onFormSubmit: (data: CandidateData) => void;
}
