'use client';

import {AboutProjectSection} from '@/components/AboutProjectSection';
import {HeroSection} from '@/components/HeroSection';
import {HowItWorksSection} from '@/components/HowItWorksSection';
import {DemoModal} from '@/components/DemoModal';
import {useState} from 'react';
import styles from './HomePage.module.css';

export default function Home() {
	const [isDemoOpen, setIsDemoOpen] = useState(false);

	return (
		<>
			<DemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
			<main className={styles.mainContent}>
				<HeroSection onDemoClick={() => setIsDemoOpen(true)} />
				<HowItWorksSection />
				<AboutProjectSection />
				<footer className={styles.footer}>
					<p className="text-secondary">
						A Portfolio Project by Judith Sanchez
					</p>
				</footer>
			</main>
		</>
	);
}
