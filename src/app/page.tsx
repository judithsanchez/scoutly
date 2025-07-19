'use client';

import {AboutProjectSection} from '@/components/AboutProjectSection';
import {HeroSection} from '@/components/HeroSection';
import {HowItWorksSection} from '@/components/HowItWorksSection';
import {Navbar} from '@/components/Navbar';
import {DemoModal} from '@/components/DemoModal';
import {DemoModalCSS} from '@/components/DemoModalCSS';
import {
	PAGE_BACKGROUND_CONTAINER,
	PAGE_BACKGROUND_GLOW,
	TEXT_SECONDARY,
} from '@/constants/styles';
import {useState, useEffect} from 'react';

export default function Home() {
	const [isDemoOpen, setIsDemoOpen] = useState(false);
	const [isDemoCSSOpen, setIsDemoCSSOpen] = useState(false);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			(window as any).__setDemoModalCSSOpen?.(setIsDemoCSSOpen);
		}
	}, []);

	return (
		<div className={`${PAGE_BACKGROUND_CONTAINER} overflow-x-hidden relative`}>
			<div className={PAGE_BACKGROUND_GLOW}></div>
			<Navbar onDemoClick={() => setIsDemoOpen(true)} />
			<DemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
			<DemoModalCSS
				isOpen={isDemoCSSOpen}
				onClose={() => setIsDemoCSSOpen(false)}
			/>
			<main className="relative z-10 homepage-content">
				<HeroSection onDemoClick={() => setIsDemoOpen(true)} />
				<HowItWorksSection />
				<AboutProjectSection />
				<footer className="text-center py-10 border-t border-slate-200 dark:border-slate-800 mt-10 md:mt-20">
					<p className={TEXT_SECONDARY}>
						A Portfolio Project by Judith Sanchez
					</p>
				</footer>
			</main>
		</div>
	);
}
