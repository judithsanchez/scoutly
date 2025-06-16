'use client';

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
		<section
			id="about-project"
			className="w-full max-w-6xl mx-auto px-4 py-10 md:py-20"
		>
			<div className="text-center">
				<h2 className="text-3xl md:text-4xl font-bold mb-4">
					About this Project
				</h2>
				<p className="max-w-3xl mx-auto text-base md:text-lg text-[var(--text-muted)] mb-12">
					Scoutly is a personal portfolio project designed to showcase a modern,
					full-stack application architecture. It demonstrates skills in AI
					integration, web scraping, database management, and building a
					responsive, interactive user interface.
				</p>
				<div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4">
					{techStack.map(tech => (
						<div
							key={tech}
							className="fade-in-card rounded-lg px-4 py-2 text-sm font-medium border bg-[var(--tech-card-bg)] border-[var(--tech-card-border)]"
						>
							{tech}
						</div>
					))}
				</div>
				<div className="mt-12">
					<a
						href="https://github.com/judithsanchez/scoutly"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-block px-6 py-3 text-base font-bold rounded-xl bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700/50 dark:hover:bg-purple-900 transition-colors"
					>
						View Source Code on GitHub
					</a>
				</div>
			</div>
		</section>
	);
}
