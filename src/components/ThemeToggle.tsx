'use client';

import {useEffect, useState} from 'react';
import {useTheme} from 'next-themes';

export function ThemeToggle() {
	const [mounted, setMounted] = useState(false);
	const {theme, setTheme} = useTheme();

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<button
				className="p-2 rounded-lg bg-card/80 hover:bg-card/60 transition-colors"
				aria-label="Toggle theme"
			>
				<div className="h-5 w-5" />
			</button>
		);
	}

	return (
		<button
			onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
			className="p-2 rounded-lg bg-card/80 hover:bg-card/60 transition-colors"
			aria-label="Toggle theme"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="h-5 w-5 text-foreground"
			>
				{theme === 'dark' ? (
					<>
						<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
					</>
				) : (
					<>
						<circle cx="12" cy="12" r="4" />
						<path d="M12 2v2" />
						<path d="M12 20v2" />
						<path d="m4.93 4.93 1.41 1.41" />
						<path d="m17.66 17.66 1.41 1.41" />
						<path d="M2 12h2" />
						<path d="M20 12h2" />
						<path d="m6.34 17.66-1.41 1.41" />
						<path d="m19.07 4.93-1.41 1.41" />
					</>
				)}
			</svg>
		</button>
	);
}
