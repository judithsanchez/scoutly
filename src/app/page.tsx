'use client';

import {AboutProjectSection} from '@/components/AboutProjectSection';
import {HeroSection} from '@/components/HeroSection';
import {HowItWorksSection} from '@/components/HowItWorksSection';
import {useState} from 'react';

export default function Home() {
	const [isDemoOpen, setIsDemoOpen] = useState(false);

	return (
		<div className="text-[var(--text-color)] overflow-x-hidden relative min-h-screen bg-[var(--page-bg)]">
			{/* Using the exact same background implementation as in profile page */}
			<div className="background-glows fixed inset-0 z-0"></div>

			{/* Main content */}
			<main className="relative z-10 homepage-content">
				<HeroSection onDemoClick={() => setIsDemoOpen(true)} />
				<HowItWorksSection />
				<AboutProjectSection />
				<footer className="text-center py-10 border-t border-[var(--nav-border)] mt-10 md:mt-20">
					<p className="text-[var(--text-muted)]">
						A Portfolio Project by Judith Sanchez
					</p>
				</footer>
			</main>
		</div>
	);
}
