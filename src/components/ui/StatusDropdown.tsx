'use client';

import React, {useState, useRef, useEffect} from 'react';
import {ApplicationStatus} from '@/types/savedJob';
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
	PlusIcon,
} from '@/components/ui/icons';

interface StatusItem {
	status: ApplicationStatus;
	icon: React.ReactNode;
	label: string;
}

interface StatusDropdownProps {
	currentStatus: ApplicationStatus;
	onStatusChange: (status: ApplicationStatus) => void;
	disabled?: boolean;
	compact?: boolean; // For use in kanban view
}

export function StatusDropdown({
	currentStatus,
	onStatusChange,
	disabled = false,
	compact = false,
}: StatusDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const statusItems: StatusItem[] = [
		{
			status: ApplicationStatus.WANT_TO_APPLY,
			icon: <StarIcon filled={true} />,
			label: 'Want to Apply',
		},
		{
			status: ApplicationStatus.PENDING_APPLICATION,
			icon: <ClockIcon />,
			label: 'Pending Application',
		},
		{
			status: ApplicationStatus.APPLIED,
			icon: <CheckIcon filled={true} />,
			label: 'Applied',
		},
		{
			status: ApplicationStatus.INTERVIEW_SCHEDULED,
			icon: <CalendarIcon />,
			label: 'Interview Scheduled',
		},
		{
			status: ApplicationStatus.TECHNICAL_ASSESSMENT,
			icon: <CodeIcon />,
			label: 'Technical Assessment',
		},
		{
			status: ApplicationStatus.OFFER_RECEIVED,
			icon: <MailIcon />,
			label: 'Offer Received',
		},
		{
			status: ApplicationStatus.OFFER_ACCEPTED,
			icon: <ThumbsUpIcon />,
			label: 'Offer Accepted',
		},
		{
			status: ApplicationStatus.OFFER_DECLINED,
			icon: <ThumbsDownIcon />,
			label: 'Offer Declined',
		},
		{
			status: ApplicationStatus.REJECTED,
			icon: <CloseIcon />,
			label: 'Rejected',
		},
		{
			status: ApplicationStatus.STALE,
			icon: <ClockIcon />,
			label: 'Stale',
		},
		{
			status: ApplicationStatus.DISCARDED,
			icon: <XIcon />,
			label: 'Discarded',
		},
	];

	const currentStatusItem = statusItems.find(
		item => item.status === currentStatus,
	);

	return (
		<div className="relative inline-block" ref={dropdownRef}>
			<button
				disabled={disabled}
				onClick={() => setIsOpen(!isOpen)}
				className={`inline-flex items-center gap-1.5 transition-colors
          ${
						compact
							? 'px-2 py-1 rounded-md text-xs'
							: 'px-3 py-2 rounded-lg text-sm font-medium border border-slate-700'
					}
          ${
						disabled
							? 'opacity-50 cursor-not-allowed'
							: 'cursor-pointer hover:bg-slate-700'
					}
          text-slate-200`}
			>
				{currentStatusItem ? (
					<>
						<span className={compact ? 'w-3 h-3' : 'w-4 h-4'}>
							{currentStatusItem.icon}
						</span>
						{!compact && (
							<span className="hidden sm:inline">
								{currentStatusItem.label}
							</span>
						)}
					</>
				) : (
					<>
						<PlusIcon />
						{!compact && <span className="hidden sm:inline">Set Status</span>}
					</>
				)}

				<svg
					className={compact ? 'w-3 h-3' : 'w-4 h-4'}
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
				>
					<polyline points="6 9 12 15 18 9"></polyline>
				</svg>
			</button>

			{isOpen && (
				<div
					className={`absolute z-10 mt-2 origin-top-right rounded-md bg-slate-800 shadow-lg border border-slate-700 ${
						compact ? 'w-48 right-0' : 'w-56'
					}`}
				>
					<div className="py-1 max-h-80 overflow-y-auto">
						{statusItems.map(item => (
							<button
								key={item.status}
								onClick={() => {
									onStatusChange(item.status);
									setIsOpen(false);
								}}
								className={`flex items-center gap-2 w-full ${
									compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
								} text-left
                  ${
										currentStatus === item.status
											? 'bg-purple-500/10 text-purple-400'
											: 'text-slate-200 hover:bg-slate-700'
									}`}
							>
								<span
									className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0`}
								>
									{item.icon}
								</span>
								<span>{item.label}</span>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
