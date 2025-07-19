'use client';

import styles from './HeroSection.module.css';

interface HeroSectionProps {
	onDemoClick: () => void;
}

export function HeroSection({onDemoClick}: HeroSectionProps) {
	return (
		<section className={styles.section}>
			<h1 className={styles.title}>
				Stop searching. <br className={styles.hiddenSm} /> Start{' '}
				<span className={styles.gradientText}>matching.</span>
			</h1>
			<p className={styles.subtitle}>
				Scoutly was born from a simple frustration: job hunting is tedious. We
				built an AI-powered scout that tirelessly scans the web for you,
				matching your unique skills to the perfect opportunities, so you can
				focus on what matters.
			</p>
			<button onClick={onDemoClick} className={styles.button}>
				Launch Interactive Demo
			</button>
		</section>
	);
}
