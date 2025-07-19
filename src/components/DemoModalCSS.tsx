'use client';

import {useEffect, useState} from 'react';
import styles from './DemoModalCSS.module.css';
import {DemoModalIcon} from './DemoModalIcon';

interface DemoModalCSSProps {
	isOpen: boolean;
	onClose: () => void;
}

export function DemoModalCSS({isOpen, onClose}: DemoModalCSSProps) {
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
		<div className={styles.modalRoot}>
			<div className={styles.modalOverlay} onClick={onClose} />
			<div className={styles.modalContainer}>
				{/* Input Step */}
				{step === 'input' && (
					<div className={styles.modalContent}>
						{/* Close Button */}
						<button
							onClick={onClose}
							className={styles.closeBtn}
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
								style={{color: '#64748b'}}
							>
								<path d="m18 6-12 12" />
								<path d="m6 6 12 12" />
							</svg>
						</button>
						<div className={styles.center + ' ' + styles.mb6}>
							<div className={styles.iconCircle}>
								<DemoModalIcon />
							</div>
							<h2 className={styles.title}>Scoutly Interactive Demo</h2>
							<p className={styles.textMuted}>
								See the AI in action. All data is for this session only and is
								not saved.
							</p>
						</div>
						<div className={styles.spaceY4}>
							<div>
								<label htmlFor="careers-url" className={styles.inputLabel}>
									Company Careers Page URL
								</label>
								<input
									type="url"
									id="careers-url"
									defaultValue="https://www.ashbyhq.com/careers"
									className={styles.inputField}
								/>
							</div>
							<div>
								<label
									htmlFor="cv-url"
									className={styles.inputLabel}
									style={{display: 'flex', alignItems: 'center'}}
								>
									<span>Public CV Link (Google Drive)</span>
									<div style={{position: 'relative', marginLeft: '0.5rem'}}>
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
											style={{color: '#64748b'}}
										>
											<circle cx="12" cy="12" r="10"></circle>
											<line x1="12" y1="16" x2="12" y2="12"></line>
											<line x1="12" y1="8" x2="12.01" y2="8"></line>
										</svg>
									</div>
								</label>
								<input
									type="url"
									id="cv-url"
									defaultValue="https://drive.google.com/file/d/1-0NUsEx0HmnTmcpMOjGSKdOJJ1Vd_uWL/view"
									className={styles.inputField}
								/>
							</div>
							<div className={styles.center + ' ' + styles.pt2}>
								<p className={styles.textXs}>
									The demo uses a default candidate profile. The full version
									allows for detailed customization.
								</p>
							</div>
						</div>
						<div className={styles.mt8}>
							<button onClick={startDemo} className={styles.demoBtn}>
								Analyze and Find Matches
							</button>
						</div>
					</div>
				)}
				{/* Processing Step */}
				{step === 'processing' && (
					<div className={styles.modalContent}>
						<button
							onClick={onClose}
							className={styles.closeBtn}
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
								style={{color: '#64748b'}}
							>
								<path d="m18 6-12 12" />
								<path d="m6 6 12 12" />
							</svg>
						</button>
						<div className={styles.center}>
							<h2 className={styles.processingTitle}>AI Scout at Work...</h2>
							<div className={styles.spinner}></div>
							<div className={styles.spaceY4 + ' ' + styles.block}>
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
					<div className={styles.resultsContent}>
						<button
							onClick={onClose}
							className={styles.closeBtn}
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
								style={{color: '#64748b'}}
							>
								<path d="m18 6-12 12" />
								<path d="m6 6 12 12" />
							</svg>
						</button>
						<div className={styles.center + ' ' + styles.mb6}>
							<h2 className={styles.title}>Demo Results</h2>
							<p className={styles.textMuted}>
								Found 2 strong matches on the page for the default profile.
							</p>
						</div>
						<div className={styles.maxH60vh}>
							<div className={styles.resultCard}>
								<div className={styles.flexBetween}>
									<div>
										<h3 className={styles.resultTitle}>
											Fullstack Software Engineer
										</h3>
										<div
											className={
												styles.flex +
												' ' +
												styles.itemsCenter +
												' ' +
												styles.gap2 +
												' ' +
												styles.mt1
											}
										>
											<p className={styles.resultCompany}>Booking.com</p>
											<span className={styles.resultCompany}>•</span>
											<p className={styles.resultCompany}>
												Amsterdam, Netherlands
											</p>
										</div>
									</div>
									<div className={styles.resultScore}>80%</div>
								</div>
								<div className={styles.techStack}>
									<span className={styles.techTag}>AWS</span>
									<span className={styles.techTag}>TypeScript</span>
									<span className={styles.techTag}>GraphQL</span>
									<span className={styles.techTag}>Camunda 8</span>
								</div>
								<div className={styles.analysisSection}>
									<h4 className={styles.analysisTitle}>Good Fit Because:</h4>
									<ul className={styles.analysisList}>
										<li>
											The candidate's profile and job description show an
											alignment of skills and expertise.
										</li>
									</ul>
								</div>
								<div className={styles.analysisSection}>
									<h4 className={styles.analysisTitle}>Key Considerations:</h4>
									<ul className={styles.analysisList}>
										<li>
											Job is located in Amsterdam, Netherlands, which is within
											the candidate's work authorization area.
										</li>
										<li>
											Candidate's domain experience is in Web Development. This
											role requires a full stack software engineer.
										</li>
									</ul>
								</div>
								<div className={styles.analysisSection}>
									<h4 className={styles.analysisTitle}>Areas for Growth:</h4>
									<ul className={styles.analysisList}>
										<li>Experience with AWS</li>
										<li>Experience with TypeScript and GraphQL</li>
										<li>Familiarity with Camunda 8</li>
									</ul>
								</div>
							</div>
						</div>
						<div className={styles.resultsFooter}>
							<p className={styles.resultsFooterText}>
								This is a preview. The full dashboard experience allows you to
								save, track, and manage all your job prospects.
							</p>
							<button onClick={onClose} className={styles.closeDemoBtn}>
								Close Demo
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

// Listen for the custom event to open the modal
if (typeof window !== 'undefined') {
	let setOpen: ((open: boolean) => void) | null = null;
	window.addEventListener('openDemoModalCSS', () => {
		setOpen && setOpen(true);
	});
	// Expose a hook for the page to use
	(window as any).__setDemoModalCSSOpen = (fn: (open: boolean) => void) => {
		setOpen = fn;
	};
}
