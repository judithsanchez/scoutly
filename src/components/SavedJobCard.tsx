import {useState} from 'react';
import {ISavedJob, ApplicationStatus} from '@/types/savedJob';

interface SavedJobCardProps {
	job: ISavedJob;
	compact?: boolean; // For dashboard view
}

export default function SavedJobCard({
	job,
	compact = false,
}: SavedJobCardProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	const statusColors = {
		[ApplicationStatus.WANT_TO_APPLY]: 'bg-blue-500',
		[ApplicationStatus.PENDING_APPLICATION]: 'bg-yellow-500',
		[ApplicationStatus.APPLIED]: 'bg-green-500',
		[ApplicationStatus.DISCARDED]: 'bg-red-500',
	};

	return (
		<div
			className={`bg-slate-800 rounded-lg ${
				compact ? 'p-4' : 'p-6'
			} mb-4 shadow-lg ${compact ? 'text-sm' : ''}`}
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
					<span
						className={`px-3 py-1 rounded-full text-xs font-medium ${
							statusColors[job.status]
						}`}
					>
						{job.status.replace(/_/g, ' ')}
					</span>
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
