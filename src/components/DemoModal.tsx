'use client';

import {useState, useEffect} from 'react';

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
		<div className="fixed inset-0 z-40">
			<div
				className="modal-enter fixed inset-0 bg-black/70 backdrop-blur-sm"
				onClick={onClose}
			/>

			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				{/* Input Step */}
				{step === 'input' && (
					<div className="modal-content-enter relative w-full max-w-lg rounded-2xl shadow-xl p-8 border bg-[var(--modal-bg)] border-[var(--modal-border)]">
						<div className="text-center mb-6">
							<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-500/20 mb-4">
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
									className="text-purple-600 dark:text-purple-300"
								>
									<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.84l8.57 3.92a2 2 0 0 0 1.66 0l8.57-3.92a1 1 0 0 0 0-1.84Z" />
									<path d="m22 17.65-8.57-3.92a2 2 0 0 0-1.66 0L3.2 17.65a1 1 0 0 0 0 1.84l8.57 3.92a2 2 0 0 0 1.66 0l8.57-3.92a1 1 0 0 0 0-1.84Z" />
									<path d="M3.2 6.08 12 10.01l8.8-3.93" />
									<path d="M12 22.08V12" />
								</svg>
							</div>
							<h2 className="text-2xl font-bold mb-2">
								Scoutly Interactive Demo
							</h2>
							<p className="text-[var(--text-muted)]">
								See the AI in action. All data is for this session only and is
								not saved.
							</p>
						</div>

						<div className="space-y-4">
							<div>
								<label
									htmlFor="careers-url"
									className="block text-sm font-medium text-[var(--text-muted)] mb-2"
								>
									Company Careers Page URL
								</label>
								<input
									type="url"
									id="careers-url"
									defaultValue="https://www.ashbyhq.com/careers"
									className="block w-full border rounded-lg py-2 px-3 bg-[var(--input-bg)] border-[var(--input-border)] focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
								/>
							</div>

							<div>
								<label
									htmlFor="cv-url"
									className="flex items-center text-sm font-medium text-[var(--text-muted)] mb-2"
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
											Your CV file on Google Drive must be public (&quot;Anyone
											with the link can view&quot;). Scoutly reads the text
											content to perform its analysis.
										</div>
									</div>
								</label>
								<input
									type="url"
									id="cv-url"
									defaultValue="https://drive.google.com/file/d/1-0NUsEx0HmnTmcpMOjGSKdOJJ1Vd_uWL/view"
									className="block w-full border rounded-lg py-2 px-3 bg-[var(--input-bg)] border-[var(--input-border)] focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
								/>
							</div>

							<div className="text-center pt-2">
								<p className="text-xs text-slate-500">
									The demo uses a default candidate profile. The full version
									allows for detailed customization.
								</p>
							</div>
						</div>

						<div className="mt-8">
							<button
								onClick={startDemo}
								className="w-full px-4 py-3 text-white bg-purple-600 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg"
							>
								Analyze and Find Matches
							</button>
						</div>
					</div>
				)}

				{/* Processing Step */}
				{step === 'processing' && (
					<div className="modal-content-enter relative w-full max-w-lg rounded-2xl shadow-xl p-8 border bg-[var(--modal-bg)] border-[var(--modal-border)]">
						<div className="text-center">
							<h2 className="text-2xl font-bold mb-4">AI Scout at Work...</h2>
							<div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
							<div className="space-y-3 text-left">
								<div className="text-[var(--text-muted)] text-center font-medium">
									{progressText}
								</div>
								<div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
									<div
										className="bg-purple-500 h-2.5 rounded-full transition-[width] duration-500 ease-in-out"
										style={{width: `${progress}%`}}
									/>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Results Step */}
				{step === 'results' && (
					<div className="modal-content-enter relative w-full max-w-3xl rounded-2xl shadow-xl p-8 border bg-[var(--modal-bg)] border-[var(--modal-border)]">
						<div className="text-center mb-6">
							<h2 className="text-2xl font-bold mb-2">Demo Results</h2>
							<p className="text-[var(--text-muted)]">
								Found 2 strong matches on the page for the default profile.
							</p>
						</div>

						<div className="max-h-[60vh] overflow-y-auto pr-2 -mr-4 space-y-4">
							<div className="rounded-lg p-4 border border-[var(--card-border)] border-l-4 border-l-yellow-400 bg-[var(--result-card-bg)]">
								<div className="flex justify-between items-start mb-3">
									<div>
										<h3 className="text-lg font-bold">
											Fullstack Software Engineer
										</h3>
										<div className="flex items-center gap-2 mt-1">
											<p className="text-sm text-[var(--text-muted)]">
												Booking.com
											</p>
											<span className="text-sm text-[var(--text-muted)]">
												•
											</span>
											<p className="text-sm text-[var(--text-muted)]">
												Amsterdam, Netherlands
											</p>
										</div>
									</div>
									<div className="text-2xl font-bold text-green-400">80%</div>
								</div>

								{/* Tech Stack Requirements */}
								<div className="flex flex-wrap gap-2 mb-4">
									<span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-xs">
										AWS
									</span>
									<span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-xs">
										TypeScript
									</span>
									<span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-xs">
										GraphQL
									</span>
									<span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-xs">
										Camunda 8
									</span>
								</div>

								{/* Analysis Sections */}
								<div className="space-y-3 text-sm">
									<div>
										<h4 className="font-semibold mb-1">Good Fit Because:</h4>
										<ul className="list-disc list-inside text-[var(--text-muted)]">
											<li>
												The candidate&apos;s profile and job description show an
												alignment of skills and expertise.
											</li>
										</ul>
									</div>

									<div>
										<h4 className="font-semibold mb-1">Key Considerations:</h4>
										<ul className="list-disc list-inside text-[var(--text-muted)]">
											<li>
												Job is located in Amsterdam, Netherlands, which is
												within the candidate&apos;s work authorization area.
											</li>
											<li>
												Candidate&apos;s domain experience is in Web
												Development. This role requires a full stack software
												engineer.
											</li>
										</ul>
									</div>

									<div>
										<h4 className="font-semibold mb-1">Areas for Growth:</h4>
										<ul className="list-disc list-inside text-[var(--text-muted)]">
											<li>Experience with AWS</li>
											<li>Experience with TypeScript and GraphQL</li>
											<li>Familiarity with Camunda 8</li>
										</ul>
									</div>
								</div>
							</div>
						</div>

						<div className="text-center mt-6">
							<p className="text-xs text-slate-500 mb-4">
								This is a preview. The full dashboard experience allows you to
								save, track, and manage all your job prospects.
							</p>
							<button
								onClick={onClose}
								className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover-bg)] transition-colors shadow-md"
							>
								Close Demo
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
