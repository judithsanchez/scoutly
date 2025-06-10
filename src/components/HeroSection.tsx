'use client';

interface HeroSectionProps {
	onGetStartedClick: () => void;
}

export function HeroSection({onGetStartedClick}: HeroSectionProps) {
	return (
		<main className="w-full pt-32 pb-20 px-4 text-center">
			<h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6">
				Stop searching. <br /> Start{' '}
				<span className="gradient-text">matching.</span>
			</h1>
			<p className="max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-300 mb-10">
				Scoutly was born from a simple frustration: job hunting is tedious. We
				built an AI-powered scout that tirelessly scans the web for you,
				matching your unique skills to the perfect opportunities, so you can
				focus on what matters.
			</p>
			<button
				onClick={onGetStartedClick}
				className="inline-block px-8 py-4 rounded-xl font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-lg transform hover:scale-105"
			>
				Get Started Free
			</button>
		</main>
	);
}
