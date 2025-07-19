import {useState} from 'react';
import ConfirmDeleteSavedJobModal from './ConfirmDeleteSavedJobModal';
import {ISavedJob, ApplicationStatus} from '@/types/savedJob';
import {StatusBadge} from '@/components/ui/StatusBadge';
import {StatusDropdown} from '@/components/ui/StatusDropdown';

interface SavedJobCardProps {
	job: ISavedJob;
	compact?: boolean;
	kanban?: boolean;
	onStatusChange?: (jobId: string, status: ApplicationStatus) => Promise<void>;
	onDelete?: (jobId: string) => Promise<void>;
}

export default function SavedJobCard({
	job,
	compact = false,
	kanban = false,
	onStatusChange,
	onDelete,
}: SavedJobCardProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);

	const handleDelete = async () => {
		if (!onDelete) return;
		setDeleteLoading(true);
		try {
			await onDelete(job._id);
			setShowDeleteModal(false);
		} finally {
			setDeleteLoading(false);
		}
	};

	const handleStatusChange = async (newStatus: ApplicationStatus) => {
		if (onStatusChange) {
			await onStatusChange(job._id, newStatus);
		}
	};

	const getStatusStyles = () => {
		switch (job.status) {
			case ApplicationStatus.WANT_TO_APPLY:
				return 'border-l-yellow-400 hover:bg-yellow-400/10';
			case ApplicationStatus.PENDING_APPLICATION:
				return 'border-l-orange-400 hover:bg-orange-400/10';
			case ApplicationStatus.APPLIED:
				return 'border-l-blue-400 hover:bg-blue-400/10';
			case ApplicationStatus.INTERVIEW_SCHEDULED:
				return 'border-l-purple-400 hover:bg-purple-400/10';
			case ApplicationStatus.TECHNICAL_ASSESSMENT:
				return 'border-l-indigo-400 hover:bg-indigo-400/10';
			case ApplicationStatus.OFFER_RECEIVED:
				return 'border-l-green-500 hover:bg-green-500/10';
			case ApplicationStatus.OFFER_ACCEPTED:
				return 'border-l-emerald-500 hover:bg-emerald-500/10';
			case ApplicationStatus.OFFER_DECLINED:
				return 'border-l-rose-500 hover:bg-rose-500/10';
			case ApplicationStatus.REJECTED:
				return 'border-l-red-500 hover:bg-red-500/10';
			case ApplicationStatus.STALE:
				return 'border-l-gray-400 hover:bg-gray-400/10';
			case ApplicationStatus.DISCARDED:
				return 'border-l-slate-500 hover:bg-slate-500/10';
			default:
				return 'border-l-slate-400 hover:bg-slate-700';
		}
	};

	// Kanban view
	if (kanban) {
		return (
			<div
				className={`bg-slate-800 rounded-lg p-3 shadow-md border-l-4 ${getStatusStyles()} hover:bg-slate-700/80 transition-all ${
					job.status === ApplicationStatus.DISCARDED ? 'opacity-60' : ''
				}`}
			>
				<div className="flex items-start justify-between mb-2">
					<h3 className="font-semibold text-white text-sm line-clamp-2">
						{job.title}
					</h3>
					<div className="text-lg font-bold text-green-400 ml-1 shrink-0">
						{job.suitabilityScore}%
					</div>
				</div>
				<p className="text-slate-400 text-xs font-medium mb-2 line-clamp-1">
					{job.company &&
					typeof job.company === 'object' &&
					'company' in job.company
						? job.company.company
						: 'Company not specified'}
				</p>
				{job.location && (
					<p className="text-slate-500 text-xs mb-2 line-clamp-1">
						{job.location}
					</p>
				)}
				{job.techStack && job.techStack.length > 0 && (
					<div className="flex flex-wrap gap-1 mb-2">
						{job.techStack.slice(0, 3).map((tech, index) => (
							<span
								key={index}
								className="bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full text-xs"
							>
								{tech}
							</span>
						))}
						{job.techStack.length > 3 && (
							<span className="text-slate-400 text-xs">
								+{job.techStack.length - 3}
							</span>
						)}
					</div>
				)}
				<div className="flex items-center justify-between border-t border-slate-700 pt-2 mt-1">
					<a
						href={job.url}
						target="_blank"
						rel="noopener noreferrer"
						className="text-purple-400 hover:text-purple-300 text-xs"
					>
						View Job
					</a>
					{onStatusChange && (
						<StatusDropdown
							currentStatus={job.status}
							onStatusChange={handleStatusChange}
							disabled={false}
							compact={true}
						/>
					)}
					{onDelete && (
						<button
							title="Delete saved job"
							className="text-red-500 hover:text-red-700 ml-2"
							onClick={() => setShowDeleteModal(true)}
							aria-label="Delete saved job"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5 inline"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"
								/>
							</svg>
						</button>
					)}
				</div>
				<ConfirmDeleteSavedJobModal
					open={showDeleteModal}
					onClose={() => setShowDeleteModal(false)}
					onConfirm={handleDelete}
					loading={deleteLoading}
				/>
			</div>
		);
	}

	// Standard view
	return (
		<div
			className={`bg-slate-800/80 rounded-lg ${
				compact ? 'p-4' : 'p-6'
			} mb-6 shadow-lg border-l-4 ${getStatusStyles()} transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${
				job.status === ApplicationStatus.DISCARDED ? 'opacity-60' : ''
			}`}
		>
			<div
				className={`flex justify-between items-start ${
					compact ? 'mb-2' : 'mb-4'
				}`}
			>
				<div className="flex-grow">
					<div className="flex items-center gap-2 mb-1">
						<h3
							className={`$${
								compact ? 'text-base' : 'text-xl'
							} font-bold text-white`}
						>
							{job.title}
						</h3>
						<StatusBadge status={job.status} />
						{onDelete && (
							<button
								title="Delete saved job"
								className="text-red-500 hover:text-red-700 ml-2"
								onClick={() => setShowDeleteModal(true)}
								aria-label="Delete saved job"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-5 w-5 inline"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"
									/>
								</svg>
							</button>
						)}
					</div>
					<p className="text-slate-400 font-medium">
						{job.company &&
						typeof job.company === 'object' &&
						'company' in job.company
							? job.company.company
							: 'Company not specified'}
					</p>
					{job.location && (
						<p className="text-slate-500 text-sm mt-1">{job.location}</p>
					)}
				</div>
				<div className="flex flex-col items-end gap-3 shrink-0 ml-4">
					<div className="text-3xl font-bold text-green-400">
						{job.suitabilityScore}%
					</div>
					<StatusDropdown
						currentStatus={job.status}
						onStatusChange={handleStatusChange}
						disabled={!onStatusChange}
					/>
				</div>
			</div>
			{job.techStack && job.techStack.length > 0 && (
				<div className={`flex flex-wrap gap-2 ${compact ? 'mb-2' : 'mb-4'}`}>
					{job.techStack.map((tech, index) => (
						<span
							key={index}
							className="bg-slate-700 text-slate-200 px-2.5 py-1 rounded-full text-xs font-medium"
						>
							{tech}
						</span>
					))}
				</div>
			)}
			<div className="border-t border-slate-700 pt-4">
				<button
					onClick={() => setIsExpanded(!isExpanded)}
					className="expand-btn text-slate-400 hover:text-white text-sm font-semibold flex items-center gap-2 w-full text-left"
				>
					<span>
						{isExpanded ? 'Hide AI Evaluation' : 'Show AI Evaluation'}
					</span>
					<svg
						className={`w-4 h-4 transform transition-transform duration-300 ${
							isExpanded ? 'rotate-180' : ''
						}`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>
				<div
					className={`accordion-content mt-4 space-y-4 text-sm ${
						isExpanded ? 'expanded' : ''
					}`}
				>
					{job.goodFitReasons && job.goodFitReasons.length > 0 && (
						<div>
							<h4 className="font-semibold text-green-400 mb-2">
								✅ Good Fit Reasons
							</h4>
							<ul className="list-disc list-inside text-slate-300 space-y-1.5">
								{job.goodFitReasons.map((reason, index) => (
									<li key={index}>{reason}</li>
								))}
							</ul>
						</div>
					)}
					{job.considerationPoints && job.considerationPoints.length > 0 && (
						<div>
							<h4 className="font-semibold text-yellow-400 mb-2">
								⚠️ Points to Consider
							</h4>
							<ul className="list-disc list-inside text-slate-300 space-y-1.5">
								{job.considerationPoints.map((point, index) => (
									<li key={index}>{point}</li>
								))}
							</ul>
						</div>
					)}
					{job.stretchGoals && job.stretchGoals.length > 0 && (
						<div>
							<h4 className="font-semibold text-blue-400 mb-2">
								🚀 Stretch Goals
							</h4>
							<ul className="list-disc list-inside text-slate-300 space-y-1.5">
								{job.stretchGoals.map((goal, index) => (
									<li key={index}>{goal}</li>
								))}
							</ul>
						</div>
					)}
					{(!job.goodFitReasons || job.goodFitReasons.length === 0) &&
						(!job.considerationPoints ||
							job.considerationPoints.length === 0) &&
						(!job.stretchGoals || job.stretchGoals.length === 0) &&
						job.notes && (
							<div>
								<h4 className="font-semibold text-blue-400 mb-2">
									🤖 AI Analysis
								</h4>
								<p className="text-slate-300 text-sm">{job.notes}</p>
							</div>
						)}
					<div className="pt-2">
						<a
							href={job.url || job.jobId}
							target="_blank"
							rel="noopener noreferrer"
							className="text-purple-400 hover:text-purple-300 font-semibold text-sm inline-flex items-center gap-1.5"
						>
							View Original Job Posting
							<svg
								className="w-4 h-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
								/>
							</svg>
						</a>
					</div>
				</div>
				<ConfirmDeleteSavedJobModal
					open={showDeleteModal}
					onClose={() => setShowDeleteModal(false)}
					onConfirm={handleDelete}
					loading={deleteLoading}
				/>
			</div>
		</div>
	);
}
