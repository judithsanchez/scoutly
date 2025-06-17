'use client';

import React, {useState} from 'react';
import {
	ApplicationStatus,
	ISavedJob,
	statusColors,
	statusPriority,
	getStatusLabel,
} from '@/types/savedJob';
import SavedJobCard from './SavedJobCard';

interface ApplicationColumnProps {
	title: string;
	status: ApplicationStatus;
	jobs: ISavedJob[];
	onStatusChange: (jobId: string, status: ApplicationStatus) => Promise<void>;
}

const ApplicationColumn: React.FC<ApplicationColumnProps> = ({
	title,
	status,
	jobs,
	onStatusChange,
}) => {
	const getBorderColor = () => {
		const color = statusColors[status] || 'slate-400';
		return `border-${color}`;
	};

	return (
		<div
			className="flex flex-col rounded-xl bg-slate-800/50 w-80 shrink-0 
        transition-all border border-slate-700"
		>
			<div className={`p-3 border-b border-l-4 ${getBorderColor()}`}>
				<h3 className="font-bold text-white">{title}</h3>
				<div className="text-sm text-slate-400">{jobs.length} jobs</div>
			</div>
			<div className="p-2 flex-1 overflow-y-auto max-h-[520px]">
				{jobs.length === 0 ? (
					<div className="flex items-center justify-center h-20 text-sm text-slate-400">
						No jobs in this stage
					</div>
				) : (
					<div className="space-y-3">
						{jobs.map(job => (
							<SavedJobCard
								key={job._id}
								job={job}
								kanban={true}
								onStatusChange={onStatusChange}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

interface ApplicationPipelineProps {
	jobs: ISavedJob[];
	onStatusChange: (jobId: string, status: ApplicationStatus) => Promise<void>;
}

const ApplicationPipeline: React.FC<ApplicationPipelineProps> = ({
	jobs,
	onStatusChange,
}) => {
	// Group jobs by status
	const groupedJobs = React.useMemo(() => {
		const groups: Record<string, ISavedJob[]> = {};

		// Initialize all status groups
		Object.values(ApplicationStatus).forEach(status => {
			groups[status] = [];
		});

		// Populate groups
		jobs.forEach(job => {
			const status = job.status || ApplicationStatus.WANT_TO_APPLY;
			if (!groups[status]) groups[status] = [];
			groups[status].push(job);
		});

		return groups;
	}, [jobs]);

	// Define the columns to show and their order
	const columns = Object.values(ApplicationStatus).map(status => ({
		status,
		title: getStatusLabel(status),
	}));

	// Sort columns by priority for display
	columns.sort((a, b) => statusPriority[b.status] - statusPriority[a.status]);

	return (
		<>
			<div className="mb-4">
				<h2 className="text-xl font-bold text-white mb-2">
					Application Pipeline
				</h2>
				<p className="text-slate-400">
					View your job applications across different stages
				</p>
			</div>
			<div className="flex gap-4 overflow-x-auto pb-4 pt-2 -mx-4 px-4">
				{columns.map(column => (
					<ApplicationColumn
						key={column.status}
						title={column.title}
						status={column.status as ApplicationStatus}
						jobs={groupedJobs[column.status] || []}
						onStatusChange={onStatusChange}
					/>
				))}
			</div>
		</>
	);
};

export default ApplicationPipeline;
