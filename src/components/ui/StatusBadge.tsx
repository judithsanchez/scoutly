'use client';

import {ApplicationStatus} from '@/types/savedJob';
import React from 'react';
import styles from './StatusBadge.module.css';
import {
	StarIcon,
	CheckIcon,
	ArchiveIcon,
	CalendarIcon,
	CodeIcon,
	CloseIcon,
	MailIcon,
	ThumbsUpIcon,
	ThumbsDownIcon,
	ClockIcon,
	XIcon,
} from '@/components/ui/icons';

interface StatusBadgeProps {
	status: ApplicationStatus;
	className?: string;
}

const statusClassMap: Record<ApplicationStatus | 'unknown', string> = {
	[ApplicationStatus.WANT_TO_APPLY]: styles['status-want-to-apply'],
	[ApplicationStatus.PENDING_APPLICATION]: styles['status-pending'],
	[ApplicationStatus.APPLIED]: styles['status-applied'],
	[ApplicationStatus.INTERVIEW_SCHEDULED]: styles['status-interview'],
	[ApplicationStatus.TECHNICAL_ASSESSMENT]: styles['status-assessment'],
	[ApplicationStatus.OFFER_RECEIVED]: styles['status-offer'],
	[ApplicationStatus.OFFER_ACCEPTED]: styles['status-accepted'],
	[ApplicationStatus.OFFER_DECLINED]: styles['status-declined'],
	[ApplicationStatus.REJECTED]: styles['status-rejected'],
	[ApplicationStatus.STALE]: styles['status-stale'],
	[ApplicationStatus.DISCARDED]: styles['status-discarded'],
	unknown: styles['status-unknown'],
};

const statusIconMap: Record<ApplicationStatus | 'unknown', React.ReactNode> = {
	[ApplicationStatus.WANT_TO_APPLY]: <StarIcon filled={true} className="" />,
	[ApplicationStatus.PENDING_APPLICATION]: <ClockIcon className="" />,
	[ApplicationStatus.APPLIED]: <CheckIcon filled={true} className="" />,
	[ApplicationStatus.INTERVIEW_SCHEDULED]: <CalendarIcon className="" />,
	[ApplicationStatus.TECHNICAL_ASSESSMENT]: <CodeIcon className="" />,
	[ApplicationStatus.OFFER_RECEIVED]: <MailIcon className="" />,
	[ApplicationStatus.OFFER_ACCEPTED]: <ThumbsUpIcon className="" />,
	[ApplicationStatus.OFFER_DECLINED]: <ThumbsDownIcon className="" />,
	[ApplicationStatus.REJECTED]: <CloseIcon className="" />,
	[ApplicationStatus.STALE]: <ClockIcon className="" />,
	[ApplicationStatus.DISCARDED]: <XIcon className="" />,
	unknown: null,
};

const statusLabelMap: Record<ApplicationStatus | 'unknown', string> = {
	[ApplicationStatus.WANT_TO_APPLY]: 'Want to Apply',
	[ApplicationStatus.PENDING_APPLICATION]: 'Pending',
	[ApplicationStatus.APPLIED]: 'Applied',
	[ApplicationStatus.INTERVIEW_SCHEDULED]: 'Interview',
	[ApplicationStatus.TECHNICAL_ASSESSMENT]: 'Assessment',
	[ApplicationStatus.OFFER_RECEIVED]: 'Offer',
	[ApplicationStatus.OFFER_ACCEPTED]: 'Accepted',
	[ApplicationStatus.OFFER_DECLINED]: 'Declined',
	[ApplicationStatus.REJECTED]: 'Rejected',
	[ApplicationStatus.STALE]: 'Stale',
	[ApplicationStatus.DISCARDED]: 'Discarded',
	unknown: 'Unknown',
};

export function StatusBadge({status, className = ''}: StatusBadgeProps) {
	const statusKey = status in statusClassMap ? status : 'unknown';
	return (
		<div
			className={`${styles.badge} ${statusClassMap[statusKey]} ${className}`}
		>
			{statusIconMap[statusKey]}
			{statusLabelMap[statusKey]}
		</div>
	);
}
