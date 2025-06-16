'use client';

import {AboutProjectSection} from '@/components/AboutProjectSection';
import {HeroSection} from '@/components/HeroSection';
import {HowItWorksSection} from '@/components/HowItWorksSection';
import {Navbar} from '@/components/Navbar';
import {DemoModal} from '@/components/DemoModal';
import {useState} from 'react';

export default function Home() {
	const [isDemoOpen, setIsDemoOpen] = useState(false);

	return (
		<>
			<div className="bg-[var(--bg-color)] text-[var(--text-color)] overflow-x-hidden">
				<div className="background-glows" />
				<Navbar onDemoClick={() => setIsDemoOpen(true)} />
				<main className="relative z-10">
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
			<DemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
		</>
	);
}
