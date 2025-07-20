'use client';

import {useState, useEffect} from 'react';
import styles from './DemoModal.module.css';

interface DemoModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function DemoModal({isOpen, onClose}: DemoModalProps) {
	const [step, setStep] = useState<'input' | 'processing' | 'results'>('input');
	const [progress, setProgress] = useState(0);
	const [progressText, setProgressText] = useState('Initializing...');

	const startDemo = () => {
		setStep('processing');
		const stages = [
			{text: 'Scraping career page...', duration: 2000, width: 25},
			{text: 'Parsing job listings...', duration: 1500, width: 50},
			{text: 'Analyzing CV content...', duration: 1500, width: 75},
			{text: 'Matching jobs with AI...', duration: 2000, width: 100},
		];

		let cumulativeDelay = 0;
		stages.forEach((stage, index) => {
			setTimeout(() => {
				setProgressText(stage.text);
				setProgress(stage.width);
				if (index === stages.length - 1) {
					setTimeout(() => setStep('results'), 500);
				}
			}, cumulativeDelay);
			cumulativeDelay += stage.duration;
		});
	};

	// Reset state when modal is closed
	useEffect(() => {
		if (!isOpen) {
			setTimeout(() => {
				setStep('input');
				setProgress(0);
				setProgressText('Initializing...');
			}, 300);
		}
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div className={styles.modalOverlay}>
			<div className={styles.overlayBg} onClick={onClose} />

			<div className={styles.modalContent}>
				{/* Input Step */}
				{step === 'input' && (
					<div className={`${styles.contentBox} modal-content-enter`}>
						{/* Close Button */}
						<button
							onClick={onClose}
							className={styles.closeButton}
							aria-label="Close modal"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="m18 6-12 12" />
								<path d="m6 6 12 12" />
							</svg>
						</button>

						<div className={`${styles.textCenter} ${styles.mb6}`}>
							<div className={`${styles.iconCircle} ${styles.iconPurple}`}>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="28"
									height="28"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.84l8.57 3.92a2 2 0 0 0 1.66 0l8.57-3.92a1 1 0 0 0 0-1.84Z" />
									<path d="m22 17.65-8.57-3.92a2 2 0 0 0-1.66 0L3.2 17.65a1 1 0 0 0 0 1.84l8.57 3.92a2 2 0 0 0 1.66 0l8.57-3.92a1 1 0 0 0 0-1.84Z" />
									<path d="M3.2 6.08 12 10.01l8.8-3.93" />
									<path d="M12 22.08V12" />
								</svg>
							</div>
							<h2 className={styles.title}>Scoutly Interactive Demo</h2>
							<p className={styles.subtitle}>
								See the AI in action. All data is for this session only and is
								not saved.
							</p>
						</div>

						<div className={styles.spaceY4}>
							<div>
								<label htmlFor="careers-url" className={styles.label}>
									Company Careers Page URL
								</label>
								<input
									type="url"
									id="careers-url"
									defaultValue="https://www.ashbyhq.com/careers"
									className={styles.input}
								/>
							</div>

							<div>
								<label
									htmlFor="cv-url"
									className={`${styles.label} flex items-center`}
								>
									<span>Public CV Link (Google Drive)</span>
									<div className="group relative ml-2">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="16"
											height="16"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
											className="text-slate-500"
										>
											<circle cx="12" cy="12" r="10"></circle>
											<line x1="12" y1="16" x2="12" y2="12"></line>
											<line x1="12" y1="8" x2="12.01" y2="8"></line>
										</svg>
										<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-slate-300 text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
											Your CV file on Google Drive must be public (&#34;Anyone
											with the link can view&#34;). Scoutly reads the text
											content to perform its analysis.
										</div>
									</div>
								</label>
								<input
									type="url"
									id="cv-url"
									defaultValue="https://drive.google.com/file/d/1-0NUsEx0HmnTmcpMOjGSKdOJJ1Vd_uWL/view"
									className={styles.input}
								/>
							</div>

							<div className={`${styles.textCenter} ${styles.pt2}`}>
								<p className={styles.textXs}>
									The demo uses a default candidate profile. The full version
									allows for detailed customization.
								</p>
							</div>
						</div>

						<div className={styles.mt8}>
							<button onClick={startDemo} className={styles.buttonPrimary}>
								Analyze and Find Matches
							</button>
						</div>
					</div>
				)}

				{/* Processing Step */}
				{step === 'processing' && (
					<div className={`${styles.contentBox} modal-content-enter`}>
						{/* Close Button */}
						<button
							onClick={onClose}
							className={styles.closeButton}
							aria-label="Close modal"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="m18 6-12 12" />
								<path d="m6 6 12 12" />
							</svg>
						</button>

						<div className={styles.textCenter}>
							<h2 className={styles.processingTitle}>AI Scout at Work...</h2>
							<div className={styles.spinner}></div>
							<div className="space-y-3 text-left">
								<div className={styles.progressText}>{progressText}</div>
								<div className={styles.progressBarBg}>
									<div
										className={styles.progressBar}
										style={{width: `${progress}%`}}
									/>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Results Step */}
				{step === 'results' && (
					<div
						className={`${styles.contentBox} ${styles.contentBoxWide} modal-content-enter`}
					>
						{/* Close Button */}
						<button
							onClick={onClose}
							className={styles.closeButton}
							aria-label="Close modal"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="m18 6-12 12" />
								<path d="m6 6 12 12" />
							</svg>
						</button>

						<div className={`${styles.textCenter} ${styles.mb6}`}>
							<h2 className={styles.title}>Demo Results</h2>
							<p className={styles.subtitle}>
								Found 2 strong matches on the page for the default profile.
							</p>
						</div>

						<div className={styles.resultCardList}>
							<div className={styles.resultCard}>
								<div className={styles.resultCardHeader}>
									<div>
										<h3 className={styles.resultCardTitle}>
											Fullstack Software Engineer
										</h3>
										<div className={styles.resultCardCompany}>
											<p className={styles.textXs}>Booking.com</p>
											<span className={styles.textXs}>•</span>
											<p className={styles.textXs}>Amsterdam, Netherlands</p>
										</div>
									</div>
									<div className={styles.resultCardScore}>80%</div>
								</div>

								{/* Tech Stack Requirements */}
								<div className="flex flex-wrap gap-2 mb-4">
									<span className={styles.badge}>AWS</span>
									<span className={styles.badge}>TypeScript</span>
									<span className={styles.badge}>GraphQL</span>
									<span className={styles.badge}>Camunda 8</span>
								</div>

								{/* Analysis Sections */}
								<div className={styles.spaceY3}>
									<div>
										<h4 className={styles.fontSemibold + ' mb-1'}>
											Good Fit Because:
										</h4>
										<ul className={styles.listDisc + ' ' + styles.subtitle}>
											<li>
												The candidate&rsquo;s profile and job description show
												an alignment of skills and expertise.
											</li>
										</ul>
									</div>

									<div>
										<h4 className={styles.fontSemibold + ' mb-1'}>
											Key Considerations:
										</h4>
										<ul className={styles.listDisc + ' ' + styles.subtitle}>
											<li>
												Job is located in Amsterdam, Netherlands, which is
												within the candidate&rsquo;s work authorization area.
											</li>
											<li>
												Candidate&rsquo;s domain experience is in Web
												Development. This role requires a full stack software
												engineer.
											</li>
										</ul>
									</div>

									<div>
										<h4 className={styles.fontSemibold + ' mb-1'}>
											Areas for Growth:
										</h4>
										<ul className={styles.listDisc + ' ' + styles.subtitle}>
											<li>Experience with AWS</li>
											<li>Experience with TypeScript and GraphQL</li>
											<li>Familiarity with Camunda 8</li>
										</ul>
									</div>
								</div>
							</div>
						</div>

						<div className={`${styles.textCenter} ${styles.mt6}`}>
							<p className={styles.textXs + ' ' + styles.mb4}>
								This is a preview. The full dashboard experience allows you to
								save, track, and manage all your job prospects.
							</p>
							<button onClick={onClose} className={styles.buttonSecondary}>
								Close Demo
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
