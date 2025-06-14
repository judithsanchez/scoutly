// Types for residence and authorization
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

// Types for languages and preferences
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

// Props interfaces for form components
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

// Shared styling constants
export const cardClasses =
	'bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-lg';
export const labelClasses = 'block text-sm font-medium text-slate-300 mb-2';
export const inputClasses =
	'block w-full bg-slate-700/50 border border-slate-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition';
export const buttonClasses =
	'px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
export const primaryButtonClasses = `${buttonClasses} bg-purple-600 text-white hover:bg-purple-700 shadow-md`;
export const secondaryButtonClasses = `${buttonClasses} bg-slate-600 hover:bg-slate-500 text-white`;
export const removeButtonClasses = `${buttonClasses} bg-pink-600/80 hover:bg-pink-700 text-white text-xs py-1 px-2 flex items-center justify-center`;
