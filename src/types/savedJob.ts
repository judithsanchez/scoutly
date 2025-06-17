export enum ApplicationStatus {
	WANT_TO_APPLY = 'WANT_TO_APPLY',
	PENDING_APPLICATION = 'PENDING_APPLICATION',
	APPLIED = 'APPLIED',
	INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
	TECHNICAL_ASSESSMENT = 'TECHNICAL_ASSESSMENT',
	REJECTED = 'REJECTED',
	OFFER_RECEIVED = 'OFFER_RECEIVED',
	OFFER_ACCEPTED = 'OFFER_ACCEPTED',
	OFFER_DECLINED = 'OFFER_DECLINED',
	STALE = 'STALE',
	DISCARDED = 'DISCARDED',
}

// Define priority for sorting statuses in the UI
export const statusPriority: Record<ApplicationStatus, number> = {
	[ApplicationStatus.INTERVIEW_SCHEDULED]: 5,
	[ApplicationStatus.TECHNICAL_ASSESSMENT]: 4,
	[ApplicationStatus.WANT_TO_APPLY]: 3,
	[ApplicationStatus.PENDING_APPLICATION]: 3,
	[ApplicationStatus.APPLIED]: 2,
	[ApplicationStatus.OFFER_RECEIVED]: 1,
	[ApplicationStatus.STALE]: 0,
	[ApplicationStatus.REJECTED]: -1,
	[ApplicationStatus.OFFER_DECLINED]: -1,
	[ApplicationStatus.OFFER_ACCEPTED]: -2,
	[ApplicationStatus.DISCARDED]: -3,
};

// Define status colors for UI elements
export const statusColors: Record<ApplicationStatus, string> = {
	[ApplicationStatus.WANT_TO_APPLY]: 'yellow-400',
	[ApplicationStatus.PENDING_APPLICATION]: 'orange-400',
	[ApplicationStatus.APPLIED]: 'blue-400',
	[ApplicationStatus.INTERVIEW_SCHEDULED]: 'purple-400',
	[ApplicationStatus.TECHNICAL_ASSESSMENT]: 'indigo-400',
	[ApplicationStatus.OFFER_RECEIVED]: 'green-500',
	[ApplicationStatus.OFFER_ACCEPTED]: 'emerald-500',
	[ApplicationStatus.OFFER_DECLINED]: 'rose-500',
	[ApplicationStatus.REJECTED]: 'red-500',
	[ApplicationStatus.STALE]: 'gray-400',
	[ApplicationStatus.DISCARDED]: 'slate-500',
};

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

// Helper to get human-readable status label
export function getStatusLabel(status: ApplicationStatus): string {
	const labels: Record<ApplicationStatus, string> = {
		[ApplicationStatus.WANT_TO_APPLY]: 'Want to Apply',
		[ApplicationStatus.PENDING_APPLICATION]: 'Pending Application',
		[ApplicationStatus.APPLIED]: 'Applied',
		[ApplicationStatus.INTERVIEW_SCHEDULED]: 'Interview Scheduled',
		[ApplicationStatus.TECHNICAL_ASSESSMENT]: 'Technical Assessment',
		[ApplicationStatus.OFFER_RECEIVED]: 'Offer Received',
		[ApplicationStatus.OFFER_ACCEPTED]: 'Offer Accepted',
		[ApplicationStatus.OFFER_DECLINED]: 'Offer Declined',
		[ApplicationStatus.REJECTED]: 'Rejected',
		[ApplicationStatus.STALE]: 'Stale',
		[ApplicationStatus.DISCARDED]: 'Discarded',
	};

	return labels[status] || 'Unknown Status';
}
