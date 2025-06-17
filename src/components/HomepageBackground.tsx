'use client';

import {useEffect} from 'react';

export function HomepageBackground() {
	useEffect(() => {
		// Force repaint on mount
		const timeout = setTimeout(() => {
			document.documentElement.classList.add('has-homepage-loaded');
		}, 100);

		return () => {
			clearTimeout(timeout);
			document.documentElement.classList.remove('has-homepage-loaded');
		};
	}, []);

	return (
		<>
			{/* Multiple background layers with different animations for maximum visibility */}
			<div
				className="fixed inset-0 z-0 homepage-background-primary"
				style={{
					backgroundImage: `
            radial-gradient(circle at 15% 25%, rgba(168, 85, 247, 0.6), transparent 60%),
            radial-gradient(circle at 85% 85%, rgba(236, 72, 153, 0.6), transparent 60%)
          `,
					animation: 'move-glows 30s ease-in-out infinite',
				}}
				aria-hidden="true"
			/>

			<div
				className="fixed inset-0 z-0 homepage-background-secondary"
				style={{
					backgroundImage: `
            radial-gradient(circle at 75% 25%, rgba(79, 70, 229, 0.5), transparent 60%),
            radial-gradient(circle at 25% 65%, rgba(168, 85, 247, 0.4), transparent 60%)
          `,
					animation: 'move-glows 25s ease-in-out infinite reverse',
					animationDelay: '-10s',
				}}
				aria-hidden="true"
			/>

			{/* Subtle pulsing overlay */}
			<div
				className="fixed inset-0 z-0 homepage-background-pulse"
				style={{
					backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.2), transparent 70%)
          `,
					animation: 'pulse-glow 8s ease-in-out infinite',
				}}
				aria-hidden="true"
			/>
		</>
	);
}
