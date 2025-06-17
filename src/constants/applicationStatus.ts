/**
 * Application status-related constants
 *
 * These constants are used for handling application statuses throughout the app,
 * providing consistent values for status priorities, colors, and labels.
 */

import {ApplicationStatus} from '@/types/savedJob';

/**
 * Human-readable labels for application statuses
 */
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
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

/**
 * Color classes for application status indicators
 */
export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
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

/**
 * Group statuses by stage for filtering and categorization
 */
export const APPLICATION_STATUS_GROUPS = {
	ACTIVE: [
		ApplicationStatus.WANT_TO_APPLY,
		ApplicationStatus.PENDING_APPLICATION,
		ApplicationStatus.APPLIED,
		ApplicationStatus.INTERVIEW_SCHEDULED,
		ApplicationStatus.TECHNICAL_ASSESSMENT,
		ApplicationStatus.OFFER_RECEIVED,
	],
	COMPLETED: [
		ApplicationStatus.OFFER_ACCEPTED,
		ApplicationStatus.OFFER_DECLINED,
		ApplicationStatus.REJECTED,
	],
	INACTIVE: [ApplicationStatus.STALE, ApplicationStatus.DISCARDED],
};
