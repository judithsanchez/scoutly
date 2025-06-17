'use client';

import {ApplicationStatus} from '@/types/savedJob';
import React from 'react';

// Import all status icons
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

export function StatusBadge({status, className = ''}: StatusBadgeProps) {
	// Get status-specific attributes
	const getStatusAttributes = () => {
		switch (status) {
			case ApplicationStatus.WANT_TO_APPLY:
				return {
					color: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/50',
					icon: <StarIcon filled={true} className="w-3.5 h-3.5" />,
					label: 'Want to Apply',
				};
			case ApplicationStatus.PENDING_APPLICATION:
				return {
					color: 'bg-orange-400/20 text-orange-400 border-orange-400/50',
					icon: <ClockIcon className="w-3.5 h-3.5" />,
					label: 'Pending',
				};
			case ApplicationStatus.APPLIED:
				return {
					color: 'bg-blue-400/20 text-blue-400 border-blue-400/50',
					icon: <CheckIcon filled={true} className="w-3.5 h-3.5" />,
					label: 'Applied',
				};
			case ApplicationStatus.INTERVIEW_SCHEDULED:
				return {
					color: 'bg-purple-400/20 text-purple-400 border-purple-400/50',
					icon: <CalendarIcon className="w-3.5 h-3.5" />,
					label: 'Interview',
				};
			case ApplicationStatus.TECHNICAL_ASSESSMENT:
				return {
					color: 'bg-indigo-400/20 text-indigo-400 border-indigo-400/50',
					icon: <CodeIcon className="w-3.5 h-3.5" />,
					label: 'Assessment',
				};
			case ApplicationStatus.OFFER_RECEIVED:
				return {
					color: 'bg-green-500/20 text-green-500 border-green-500/50',
					icon: <MailIcon className="w-3.5 h-3.5" />,
					label: 'Offer',
				};
			case ApplicationStatus.OFFER_ACCEPTED:
				return {
					color: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50',
					icon: <ThumbsUpIcon className="w-3.5 h-3.5" />,
					label: 'Accepted',
				};
			case ApplicationStatus.OFFER_DECLINED:
				return {
					color: 'bg-rose-500/20 text-rose-500 border-rose-500/50',
					icon: <ThumbsDownIcon className="w-3.5 h-3.5" />,
					label: 'Declined',
				};
			case ApplicationStatus.REJECTED:
				return {
					color: 'bg-red-500/20 text-red-500 border-red-500/50',
					icon: <CloseIcon className="w-3.5 h-3.5" />,
					label: 'Rejected',
				};
			case ApplicationStatus.STALE:
				return {
					color: 'bg-gray-400/20 text-gray-400 border-gray-400/50',
					icon: <ClockIcon className="w-3.5 h-3.5" />,
					label: 'Stale',
				};
			case ApplicationStatus.DISCARDED:
				return {
					color: 'bg-slate-500/20 text-slate-500 border-slate-500/50',
					icon: <XIcon className="w-3.5 h-3.5" />,
					label: 'Discarded',
				};
			default:
				return {
					color: 'bg-slate-400/20 text-slate-400 border-slate-400/50',
					icon: null,
					label: 'Unknown',
				};
		}
	};

	const {color, icon, label} = getStatusAttributes();

	return (
		<div
			className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${color} ${className}`}
		>
			{icon}
			{label}
		</div>
	);
}
