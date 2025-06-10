'use client';

interface HeroSectionProps {
	onGetStartedClick?: () => void;
}

export function HeroSection() {
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
				className="px-8 py-3 text-base font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-md"
				onClick={() => {
					const loginButton = document.querySelector(
						'button[data-login-button]',
					);
					if (loginButton) {
						(loginButton as HTMLButtonElement).click();
					}
				}}
			>
				Get Started Free
			</button>
		</main>
	);
}
