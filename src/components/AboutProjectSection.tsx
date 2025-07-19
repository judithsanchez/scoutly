'use client';

import styles from './AboutProjectSection.module.css';

export function AboutProjectSection() {
	const techStack = [
		'Next.js',
		'TypeScript',
		'Tailwind CSS',
		'Playwright',
		'MongoDB',
		'Google Gemini',
	];

	return (
		<section id="about-project" className={styles.section}>
			<div className={styles.centerText}>
				<h2 className={styles.title}>About this Project</h2>
				<p className={styles.subtitle}>
					Scoutly is a personal portfolio project designed to showcase a modern,
					full-stack application architecture. It demonstrates skills in AI
					integration, web scraping, database management, and building a
					responsive, interactive user interface.
				</p>
				<div className={styles.techStack}>
					{techStack.map(tech => (
						<div key={tech} className={styles.techCard}>
							{tech}
						</div>
					))}
				</div>
				<div className={styles.mt12}>
					<a
						href="https://github.com/judithsanchez/scoutly"
						target="_blank"
						rel="noopener noreferrer"
						className={styles.githubButton}
					>
						View Source Code on GitHub
					</a>
				</div>
			</div>
		</section>
	);
}
