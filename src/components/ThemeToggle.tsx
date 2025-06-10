'use client';

import {useTheme} from 'next-themes';
import {Moon, Sun} from 'lucide-react';

export function ThemeToggle() {
	const {theme, setTheme} = useTheme();

	return (
		<button
			onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
			className="p-2 rounded-lg bg-card/80 hover:bg-card/60 transition-colors"
			aria-label="Toggle theme"
		>
			{theme === 'dark' ? (
				<Sun className="h-5 w-5 text-foreground" />
			) : (
				<Moon className="h-5 w-5 text-foreground" />
			)}
		</button>
	);
}
