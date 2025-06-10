export enum ApplicationStatus {
	WANT_TO_APPLY = 'WANT_TO_APPLY',
	PENDING_APPLICATION = 'PENDING_APPLICATION',
	APPLIED = 'APPLIED',
	DISCARDED = 'DISCARDED',
}

export interface ISavedJob {
	_id: string;
	title: string;
	url: string;
	location?: string;
	timezone?: string;
	salary?: {
		min?: number;
		max?: number;
		currency?: string;
		period?: string;
	};
	techStack?: string[];
	experienceLevel?: string;
	languageRequirements?: string[];
	visaSponsorshipOffered?: boolean;
	relocationAssistanceOffered?: boolean;
	goodFitReasons: string[];
	considerationPoints: string[];
	stretchGoals: string[];
	suitabilityScore: number;
	status: ApplicationStatus;
	notes?: string;
	user: string;
	company: {
		_id: string;
		company: string;
	};
	createdAt: string;
	updatedAt: string;
}
