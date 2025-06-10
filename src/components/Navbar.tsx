'use client';

import Link from 'next/link';
import {ThemeToggle} from './ThemeToggle';

interface NavbarProps {
	onLoginClick: () => void;
}

export function Navbar({onLoginClick}: NavbarProps) {
	return (
		<nav className="fixed top-0 left-0 right-0 px-4 mt-4 z-40">
			<div className="mx-auto p-3 rounded-2xl border border-slate-300/80 dark:border-white/20 bg-white/50 dark:bg-white/10 shadow-lg backdrop-blur-xl">
				<div className="flex justify-between items-center max-w-[2000px] mx-auto">
					<Link href="/" className="flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="text-purple-600 dark:text-purple-400"
						>
							<circle cx="12" cy="12" r="2"></circle>
							<path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path>
						</svg>
						<span className="text-2xl font-bold tracking-tighter text-slate-900 dark:text-white">
							Scoutly
						</span>
					</Link>

					<div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-white/80">
						<Link
							href="#how-it-works"
							className="hover:text-slate-900 dark:hover:text-white transition-colors"
						>
							How It Works
						</Link>
						<Link
							href="#"
							className="hover:text-slate-900 dark:hover:text-white transition-colors"
						>
							Features
						</Link>
						<Link
							href="#"
							className="hover:text-slate-900 dark:hover:text-white transition-colors"
						>
							Pricing
						</Link>
					</div>

					<div className="flex items-center gap-2">
						<ThemeToggle />
						<button
							onClick={onLoginClick}
							className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-gray-200 transition-colors shadow-md"
						>
							Log In
						</button>
					</div>
				</div>
			</div>
		</nav>
	);
}
