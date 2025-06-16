'use client';

export function HowItWorksSection() {
	return (
		<section
			id="how-it-works"
			className="w-full max-w-6xl mx-auto px-4 py-10 md:py-20"
		>
			<h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
				How It Works
			</h2>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
				{/* Resume Analysis Card */}
				<div className="feature-card p-6 md:p-8 rounded-2xl border bg-[var(--card-bg)] border-[var(--card-border)]">
					<div className="flex items-center justify-center h-16 w-16 mb-6 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="32"
							height="32"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
							<polyline points="14 2 14 8 20 8"></polyline>
							<line x1="16" y1="13" x2="8" y2="13"></line>
							<line x1="16" y1="17" x2="8" y2="17"></line>
							<polyline points="10 9 9 9 8 9"></polyline>
						</svg>
					</div>
					<h3 className="text-xl md:text-2xl font-bold mb-3">
						1. Provide Your CV
					</h3>
					<p className="text-[var(--text-muted)]">
						Give our AI scout your resume. It analyzes your unique skills,
						experience, and career goals to understand exactly what you&apos;re
						looking for.
					</p>
				</div>

				{/* Web Scouting Card */}
				<div className="feature-card p-6 md:p-8 rounded-2xl border bg-[var(--card-bg)] border-[var(--card-border)]">
					<div className="flex items-center justify-center h-16 w-16 mb-6 rounded-full bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-300">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="32"
							height="32"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
						</svg>
					</div>
					<h3 className="text-xl md:text-2xl font-bold mb-3">
						2. We Scout the Web
					</h3>
					<p className="text-[var(--text-muted)]">
						Our system works around the clock, scraping hundreds of company
						career pages. It intelligently filters out the noise to find new,
						relevant job postings.
					</p>
				</div>

				{/* Perfect Matches Card */}
				<div className="feature-card p-6 md:p-8 rounded-2xl border bg-[var(--card-bg)] border-[var(--card-border)]">
					<div className="flex items-center justify-center h-16 w-16 mb-6 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="32"
							height="32"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
							<circle cx="12" cy="10" r="3"></circle>
						</svg>
					</div>
					<h3 className="text-xl md:text-2xl font-bold mb-3">
						3. Get Perfect Matches
					</h3>
					<p className="text-[var(--text-muted)]">
						Receive a curated list of jobs that are a true fit, complete with a
						suitability score and breakdown of why it matches your profile.
					</p>
				</div>
			</div>
		</section>
	);
}
