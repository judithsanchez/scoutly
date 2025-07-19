'use client';

import styles from './HowItWorksSection.module.css';

export function HowItWorksSection() {
	return (
		<section id="how-it-works" className={styles.section}>
			<h2 className={styles.title}>How It Works</h2>
			<div className={styles.featuresGrid}>
				{/* Resume Analysis Card */}
				<div className={styles.featureCard}>
					<div className={`${styles.featureIcon} ${styles.iconPurple}`}>
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
					<h3 className={styles.cardTitle}>1. Provide Your CV</h3>
					<p className={styles.cardText}>
						Give our AI scout your resume. It analyzes your unique skills,
						experience, and career goals to understand exactly what you're
						looking for.
					</p>
				</div>

				{/* Web Scouting Card */}
				<div className={styles.featureCard}>
					<div className={`${styles.featureIcon} ${styles.iconPink}`}>
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
					<h3 className={styles.cardTitle}>2. We Scout the Web</h3>
					<p className={styles.cardText}>
						Our system works around the clock, scraping hundreds of company
						career pages. It intelligently filters out the noise to find new,
						relevant job postings.
					</p>
				</div>

				{/* Perfect Matches Card */}
				<div className={styles.featureCard}>
					<div className={`${styles.featureIcon} ${styles.iconSky}`}>
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
					<h3 className={styles.cardTitle}>3. Get Perfect Matches</h3>
					<p className={styles.cardText}>
						Receive a curated list of jobs that are a true fit, complete with a
						suitability score and breakdown of why it matches your profile.
					</p>
				</div>
			</div>
		</section>
	);
}
