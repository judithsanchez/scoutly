'use client';

import {HeroSection} from '@/components/HeroSection';
import {HowItWorksSection} from '@/components/HowItWorksSection';

export default function Home() {
	return (
		<div className="bg-background text-foreground overflow-x-hidden">
			<div className="background-glows" />
			<HeroSection />
			<HowItWorksSection />
		</div>
	);
}
