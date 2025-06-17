'use client';

import {useState, useEffect} from 'react';

export function BackgroundEffects() {
	// Track mounting to avoid hydration issues
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);

		// Force re-render of background elements
		const timer = setTimeout(() => {
			const glows = document.querySelectorAll('.background-glows');
			glows.forEach(glow => {
				// Force a repaint by toggling a class
				glow.classList.add('force-repaint');
				setTimeout(() => glow.classList.remove('force-repaint'), 50);
			});
		}, 200);

		return () => clearTimeout(timer);
	}, []);

	if (!mounted) return null;

	return (
		<>
			{/* Extremely visible background effects that render on top of everything else */}
			<div
				className="fixed inset-0 pointer-events-none z-0"
				style={{isolation: 'isolate'}}
			>
				<div
					className="background-glows"
					style={{
						backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(168, 85, 247, 0.9), transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(236, 72, 153, 0.9), transparent 50%)
            `,
						opacity: 1,
					}}
				/>
				<div
					className="background-glows"
					style={{
						backgroundImage: `
              radial-gradient(circle at 70% 20%, rgba(79, 70, 229, 0.8), transparent 60%),
              radial-gradient(circle at 30% 70%, rgba(236, 72, 153, 0.8), transparent 60%)
            `,
						animationDelay: '-10s',
						opacity: 0.9,
					}}
				/>
				<div
					className="background-glows"
					style={{
						backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.7), transparent 70%)`,
						animationDelay: '-20s',
						opacity: 0.8,
					}}
				/>
			</div>
		</>
	);
}
