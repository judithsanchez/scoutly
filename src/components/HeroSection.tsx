'use client';

interface HeroSectionProps {
	onDemoClick: () => void;
}

export function HeroSection({onDemoClick}: HeroSectionProps) {
	return (
		<section className="w-full pt-32 md:pt-48 pb-16 md:pb-20 px-4 text-center">
			<h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tighter mb-6">
				Stop searching. <br className="hidden sm:block" /> Start{' '}
				<span className="gradient-text">matching.</span>
			</h1>
			<p className="max-w-3xl mx-auto text-base md:text-lg text-[var(--text-muted)] mb-10">
				Scoutly was born from a simple frustration: job hunting is tedious. We
				built an AI-powered scout that tirelessly scans the web for you,
				matching your unique skills to the perfect opportunities, so you can
				focus on what matters.
			</p>
			<button
				onClick={onDemoClick}
				className="px-8 py-3 text-base font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-md"
			>
				Launch Interactive Demo
			</button>
		</section>
	);
}
