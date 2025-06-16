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

	// Get status-specific styles
	const getStatusStyles = () => {
		switch (job.status) {
			case ApplicationStatus.WANT_TO_APPLY:
				return 'border-l-yellow-400 hover:bg-yellow-400/10';
			case ApplicationStatus.APPLIED:
				return 'border-l-green-400 hover:bg-green-400/10';
			case ApplicationStatus.DISCARDED:
				return 'border-l-red-500 hover:bg-red-500/10';
			default:
				return 'border-l-slate-400 hover:bg-slate-700';
		}
	};

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
					<h3
						className={`${
							compact ? 'text-base' : 'text-xl'
						} font-bold text-white mb-1`}
					>
						{job.title}
					</h3>
					<p className="text-slate-400 font-medium">
						{job.company &&
						typeof job.company === 'object' &&
						'company' in job.company
							? (job.company as any).company
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
					<div className="flex items-center gap-2">
						<button
							onClick={() =>
								handleStatusChange(ApplicationStatus.WANT_TO_APPLY)
							}
							className={`status-btn p-2 rounded-full transition-colors ${
								job.status === ApplicationStatus.WANT_TO_APPLY
									? 'bg-yellow-400/20 text-yellow-400'
									: 'text-slate-400 hover:bg-slate-700'
							}`}
							title="Want to Apply"
						>
							<StarIcon
								filled={job.status === ApplicationStatus.WANT_TO_APPLY}
							/>
						</button>
						<button
							onClick={() => handleStatusChange(ApplicationStatus.APPLIED)}
							className={`status-btn p-2 rounded-full transition-colors ${
								job.status === ApplicationStatus.APPLIED
									? 'bg-green-400/20 text-green-400'
									: 'text-slate-400 hover:bg-slate-700'
							}`}
							title="Mark as Applied"
						>
							<CheckIcon filled={job.status === ApplicationStatus.APPLIED} />
						</button>
						<button
							onClick={() => handleStatusChange(ApplicationStatus.DISCARDED)}
							className={`status-btn p-2 rounded-full transition-colors ${
								job.status === ApplicationStatus.DISCARDED
									? 'bg-red-500/20 text-red-400'
									: 'text-slate-400 hover:bg-slate-700'
							}`}
							title="Discard"
						>
							<ArchiveIcon />
						</button>
					</div>
				</div>
			</div>

			{/* Tech Stack Tags */}
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
					{job.goodFitReasons.length > 0 && (
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

					{job.considerationPoints.length > 0 && (
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

					{job.stretchGoals.length > 0 && (
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

					<div className="pt-2">
						<a
							href={job.url}
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
			</div>
		</div>
	);
}
