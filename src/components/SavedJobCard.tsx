import {useState} from 'react';
import {useAuth} from '@/contexts/AuthContext';
import ConfirmDeleteSavedJobModal from './ConfirmDeleteSavedJobModal';
import {ISavedJob, ApplicationStatus} from '@/types/savedJob';
import {StatusBadge} from '@/components/ui/StatusBadge';
import {StatusDropdown} from '@/components/ui/StatusDropdown';
import styles from './SavedJobCard.module.css';

interface SavedJobCardProps {
	job: ISavedJob;
	compact?: boolean;
	kanban?: boolean;
	onStatusChange?: (jobId: string, status: ApplicationStatus) => Promise<void>;
	onDeleted?: (jobId: string) => void;
}

export default function SavedJobCard({
	job,
	compact = false,
	kanban = false,
	onStatusChange,
	onDeleted,
}: SavedJobCardProps) {
	const {token} = useAuth();
	const [isExpanded, setIsExpanded] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);

	const handleDelete = async () => {
		setDeleteLoading(true);
		try {
			const headers: Record<string, string> = {};
			if (token) {
				headers['Authorization'] = `Bearer ${token}`;
			}
			const res = await fetch(`/api/jobs/saved/${job._id}`, {
				method: 'DELETE',
				headers,
			});
			if (!res.ok) {
				throw new Error('Failed to delete saved job');
			}
			setShowDeleteModal(false);
			if (onDeleted) onDeleted(job._id);
		} catch (err) {
			console.error(err);
		} finally {
			setDeleteLoading(false);
		}
	};

	const handleStatusChange = async (newStatus: ApplicationStatus) => {
		if (onStatusChange) {
			await onStatusChange(job._id, newStatus);
		}
	};

	const getStatusClass = () => {
		switch (job.status) {
			case ApplicationStatus.WANT_TO_APPLY:
				return styles.statusYellow;
			case ApplicationStatus.PENDING_APPLICATION:
				return styles.statusOrange;
			case ApplicationStatus.APPLIED:
				return styles.statusBlue;
			case ApplicationStatus.INTERVIEW_SCHEDULED:
				return styles.statusPurple;
			case ApplicationStatus.TECHNICAL_ASSESSMENT:
				return styles.statusIndigo;
			case ApplicationStatus.OFFER_RECEIVED:
				return styles.statusGreen;
			case ApplicationStatus.OFFER_ACCEPTED:
				return styles.statusEmerald;
			case ApplicationStatus.OFFER_DECLINED:
				return styles.statusRose;
			case ApplicationStatus.REJECTED:
				return styles.statusRed;
			case ApplicationStatus.STALE:
				return styles.statusGray;
			case ApplicationStatus.DISCARDED:
				return styles.statusSlate;
			default:
				return styles.statusSlate;
		}
	};

	if (kanban) {
		return (
			<div
				className={`${styles.kanbanCard} ${getStatusClass()} ${
					job.status === ApplicationStatus.DISCARDED
						? styles.kanbanCardDiscarded
						: ''
				}`}
			>
				<div className={styles.header}>
					<h3 className={`${styles.title} ${styles.titleCompact}`}>
						{job.title}
					</h3>
					<div className={`${styles.score} ${styles.scoreKanban}`}>
						{job.suitabilityScore}%
					</div>
				</div>
				<p className={styles.company}>
					{job.company &&
					typeof job.company === 'object' &&
					'company' in job.company
						? job.company.company
						: 'Company not specified'}
				</p>
				{job.location && <p className={styles.location}>{job.location}</p>}
				{job.techStack && job.techStack.length > 0 && (
					<div className={`${styles.techStack} ${styles.techStackKanban}`}>
						{job.techStack.slice(0, 3).map((tech, index) => (
							<span key={index} className={styles.techBadgeKanban}>
								{tech}
							</span>
						))}
						{job.techStack.length > 3 && (
							<span className={styles.techBadgeExtra}>
								+{job.techStack.length - 3}
							</span>
						)}
					</div>
				)}
				<div className={`${styles.footer} ${styles.footerKanban}`}>
					<a
						href={job.url}
						target="_blank"
						rel="noopener noreferrer"
						className={styles.viewJobLink}
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
					<button
						title="Delete saved job"
						className={styles.deleteBtn}
						onClick={() => setShowDeleteModal(true)}
						aria-label="Delete saved job"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className={styles.inlineIcon}
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

	return (
		<div
			className={`${styles.card} ${
				compact ? styles.cardCompact : styles.cardStandard
			} ${getStatusClass()} ${
				job.status === ApplicationStatus.DISCARDED ? styles.cardDiscarded : ''
			}`}
		>
			<div
				className={`${styles.header} ${compact ? styles.headerCompact : ''}`}
			>
				<div style={{flexGrow: 1}}>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
							marginBottom: '0.25rem',
						}}
					>
						<h3
							className={`${
								compact ? styles.titleCompact : styles.titleStandard
							} ${styles.title}`}
						>
							{job.title}
						</h3>
						<StatusBadge status={job.status} />
						<button
							title="Delete saved job"
							className={styles.deleteBtn}
							onClick={() => setShowDeleteModal(true)}
							aria-label="Delete saved job"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className={styles.inlineIcon}
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
					</div>
					<p className={styles.company}>
						{job.company &&
						typeof job.company === 'object' &&
						'company' in job.company
							? job.company.company
							: 'Company not specified'}
					</p>
					{job.location && <p className={styles.location}>{job.location}</p>}
				</div>
				<div className={styles.statusCol}>
					<div className={styles.score}>{job.suitabilityScore}%</div>
					<StatusDropdown
						currentStatus={job.status}
						onStatusChange={handleStatusChange}
						disabled={!onStatusChange}
					/>
				</div>
			</div>
			{job.techStack && job.techStack.length > 0 && (
				<div className={styles.techStack}>
					{job.techStack.map((tech, index) => (
						<span key={index} className={styles.techBadge}>
							{tech}
						</span>
					))}
				</div>
			)}
			<div className={styles.footer}>
				<button
					onClick={() => setIsExpanded(!isExpanded)}
					className={styles.accordionBtn}
				>
					<span>
						{isExpanded ? 'Hide AI Evaluation' : 'Show AI Evaluation'}
					</span>
					<svg
						className={`${styles.inlineIcon} ${styles.transitionTransform} ${
							isExpanded ? styles.rotate180 : ''
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
					className={`${styles.accordionContent} ${
						isExpanded ? 'expanded' : ''
					}`}
				>
					{job.goodFitReasons && job.goodFitReasons.length > 0 && (
						<div>
							<h4 className={`${styles.sectionTitle} ${styles.goodFit}`}>
								✅ Good Fit Reasons
							</h4>
							<ul
								className={`${styles.listDisc} ${styles.listInside} ${styles.spaceY15}`}
							>
								{job.goodFitReasons.map((reason, index) => (
									<li key={index}>{reason}</li>
								))}
							</ul>
						</div>
					)}
					{job.considerationPoints && job.considerationPoints.length > 0 && (
						<div>
							<h4 className={`${styles.sectionTitle} ${styles.consideration}`}>
								⚠️ Points to Consider
							</h4>
							<ul
								className={`${styles.listDisc} ${styles.listInside} ${styles.spaceY15}`}
							>
								{job.considerationPoints.map((point, index) => (
									<li key={index}>{point}</li>
								))}
							</ul>
						</div>
					)}
					{job.stretchGoals && job.stretchGoals.length > 0 && (
						<div>
							<h4 className={`${styles.sectionTitle} ${styles.stretchGoals}`}>
								🚀 Stretch Goals
							</h4>
							<ul
								className={`${styles.listDisc} ${styles.listInside} ${styles.spaceY15}`}
							>
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
								<h4 className={`${styles.sectionTitle} ${styles.aiAnalysis}`}>
									🤖 AI Analysis
								</h4>
								<p style={{color: '#cbd5e1', fontSize: '0.875rem'}}>
									{job.notes}
								</p>
							</div>
						)}
					<div className={styles.pt2}>
						<a
							href={job.url || job.jobId}
							target="_blank"
							rel="noopener noreferrer"
							className={styles.viewJobLink}
						>
							View Original Job Posting
							<svg
								className={styles.inlineIcon}
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
