'use client';

import Link from 'next/link';
import {ThemeToggle} from './ThemeToggle';

interface NavbarProps {
	onLoginClick: () => void;
}

export function Navbar({onLoginClick}: NavbarProps) {
	return (
		<nav className="w-full max-w-6xl fixed top-0 left-1/2 -translate-x-1/2 mt-4 z-40">
			<div className="mx-auto p-3 rounded-2xl border border-border/20 bg-background/10 shadow-lg backdrop-blur-xl">
				<div className="container mx-auto flex justify-between items-center">
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
							className="text-purple-400"
						>
							<circle cx="12" cy="12" r="2"></circle>
							<path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path>
						</svg>
						<span className="text-2xl font-bold tracking-tighter text-foreground">
							Scoutly
						</span>
					</Link>

					<div className="hidden md:flex items-center gap-6 text-sm font-medium text-foreground/80">
						<Link href="#" className="hover:text-foreground transition-colors">
							How It Works
						</Link>
						<Link href="#" className="hover:text-foreground transition-colors">
							Features
						</Link>
						<Link href="#" className="hover:text-foreground transition-colors">
							Pricing
						</Link>
					</div>

					<div className="flex items-center gap-4">
						<ThemeToggle />
						<button
							onClick={onLoginClick}
							className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md"
						>
							Log In
						</button>
					</div>
				</div>
			</div>
		</nav>
	);
}
