import {useState} from 'react';
import {ISavedJob, ApplicationStatus} from '@/types/savedJob';
import {StarIcon, CheckIcon, ArchiveIcon} from '@/components/ui/status-icons';

interface SavedJobCardProps {
	job: ISavedJob;
	compact?: boolean; // For dashboard view
	onStatusChange?: (jobId: string, status: ApplicationStatus) => Promise<void>;
}

export default function SavedJobCard({
	job,
	compact = false,
	onStatusChange,
}: SavedJobCardProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	const handleStatusChange = async (newStatus: ApplicationStatus) => {
		if (onStatusChange) {
			await onStatusChange(job._id, newStatus);
		}
	};

	return (
		<div
			className={`bg-slate-800 rounded-lg ${
				compact ? 'p-4' : 'p-6'
			} mb-4 shadow-lg ${compact ? 'text-sm' : ''} ${
				job.status === ApplicationStatus.DISCARDED ? 'opacity-60' : ''
			}`}
		>
			<div
				className={`flex justify-between items-start ${
					compact ? 'mb-2' : 'mb-4'
				}`}
			>
				<div>
					<h3
						className={`${
							compact ? 'text-base' : 'text-xl'
						} font-semibold text-white mb-2`}
					>
						{job.title}
					</h3>
					<p className="text-slate-400">
						{job.company &&
						typeof job.company === 'object' &&
						'company' in job.company
							? (job.company as any).company
							: 'Company not specified'}
					</p>
					{job.location && (
						<p className="text-slate-400 text-sm mt-1">{job.location}</p>
					)}
				</div>
				<div className="flex flex-col items-end gap-2">
					<div className="flex items-center gap-2">
						<button
							onClick={() =>
								handleStatusChange(ApplicationStatus.WANT_TO_APPLY)
							}
							className={`p-1.5 rounded-full hover:bg-slate-700 transition-colors ${
								job.status === ApplicationStatus.WANT_TO_APPLY
									? 'text-yellow-400'
									: 'text-slate-400'
							}`}
							title="Favorite"
						>
							<StarIcon
								filled={job.status === ApplicationStatus.WANT_TO_APPLY}
							/>
						</button>
						<button
							onClick={() => handleStatusChange(ApplicationStatus.APPLIED)}
							className={`p-1.5 rounded-full hover:bg-slate-700 transition-colors ${
								job.status === ApplicationStatus.APPLIED
									? 'text-green-400'
									: 'text-slate-400'
							}`}
							title="Mark as Applied"
						>
							<CheckIcon filled={job.status === ApplicationStatus.APPLIED} />
						</button>
						<button
							onClick={() => handleStatusChange(ApplicationStatus.DISCARDED)}
							className={`p-1.5 rounded-full hover:bg-slate-700 transition-colors ${
								job.status === ApplicationStatus.DISCARDED
									? 'text-red-400'
									: 'text-slate-400'
							}`}
							title="Archive"
						>
							<ArchiveIcon />
						</button>
					</div>
					<div className="text-lg font-bold text-green-400">
						{job.suitabilityScore}%
					</div>
				</div>
			</div>

			{/* Tech Stack Tags */}
			{job.techStack && job.techStack.length > 0 && (
				<div className={`flex flex-wrap gap-2 ${compact ? 'mb-2' : 'mb-4'}`}>
					{job.techStack.map((tech, index) => (
						<span
							key={index}
							className="bg-slate-700 text-slate-200 px-2 py-1 rounded-md text-sm"
						>
							{tech}
						</span>
					))}
				</div>
			)}

			{/* Expand/Collapse Button */}
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="text-slate-400 hover:text-white text-sm font-medium flex items-center gap-1"
			>
				{isExpanded ? 'Show Less' : 'Show AI Evaluation'}
				<svg
					className={`w-4 h-4 transform transition-transform ${
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

			{/* Expandable Content */}
			{isExpanded && (
				<div className="mt-4 space-y-4 text-sm">
					{job.goodFitReasons.length > 0 && (
						<div>
							<h4 className="font-medium text-green-400 mb-2">
								Good Fit Reasons
							</h4>
							<ul className="list-disc list-inside text-slate-300 space-y-1">
								{job.goodFitReasons.map((reason, index) => (
									<li key={index}>{reason}</li>
								))}
							</ul>
						</div>
					)}

					{job.considerationPoints.length > 0 && (
						<div>
							<h4 className="font-medium text-yellow-400 mb-2">
								Points to Consider
							</h4>
							<ul className="list-disc list-inside text-slate-300 space-y-1">
								{job.considerationPoints.map((point, index) => (
									<li key={index}>{point}</li>
								))}
							</ul>
						</div>
					)}

					{job.stretchGoals.length > 0 && (
						<div>
							<h4 className="font-medium text-blue-400 mb-2">Stretch Goals</h4>
							<ul className="list-disc list-inside text-slate-300 space-y-1">
								{job.stretchGoals.map((goal, index) => (
									<li key={index}>{goal}</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}

			{/* External Link */}
			<div className="mt-4">
				<a
					href={job.url}
					target="_blank"
					rel="noopener noreferrer"
					className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
				>
					View Job Posting
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
	);
}
