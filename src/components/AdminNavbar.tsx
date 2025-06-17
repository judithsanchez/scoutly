'use client';

import React, {useState, useEffect} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useAuth} from '@/contexts/AuthContext';
import {useTheme} from 'next-themes';

interface NavItem {
	label: string;
	href: string;
	icon?: React.ReactNode;
}

export default function AdminNavbar() {
	const pathname = usePathname();
	const {user, isAuthenticated, isDevBypass} = useAuth();
	const {theme, setTheme} = useTheme();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	// Close mobile menu when changing routes
	useEffect(() => {
		setIsMobileMenuOpen(false);
	}, [pathname]);

	const navItems: NavItem[] = [
		{label: 'Dashboard', href: '/dashboard'},
		{label: 'Saved Jobs', href: '/saved-jobs'},
		{label: 'Companies', href: '/companies'},
		{label: 'Profile', href: '/profile'},
	];

	const toggleTheme = () => {
		setTheme(theme === 'dark' ? 'light' : 'dark');
	};

	return (
		<nav className="fixed top-0 left-0 right-0 px-4 mt-4 z-40">
			<div className="nav-card mx-auto p-3 rounded-2xl border shadow-lg backdrop-blur-xl max-w-7xl bg-white/10 dark:bg-slate-900/70 border-slate-200/20 dark:border-slate-700/20">
				<div className="flex justify-between items-center">
					<Link href="/dashboard" className="flex items-center gap-2">
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

					{/* Desktop Navigation */}
					<div className="hidden md:flex items-center gap-6 text-sm font-medium">
						{navItems.map(item => (
							<Link
								key={item.href}
								href={item.href}
								className={`transition-colors ${
									pathname === item.href
										? 'text-purple-600 dark:text-purple-400 font-semibold'
										: 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
								}`}
							>
								{item.label}
							</Link>
						))}
					</div>

					{/* Right side actions */}
					<div className="flex items-center gap-2">
						{/* Theme toggle button */}
						<button
							onClick={toggleTheme}
							className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-200/50 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
							aria-label="Toggle theme"
						>
							{theme === 'dark' ? (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<circle cx="12" cy="12" r="4"></circle>
									<path d="M12 2v2"></path>
									<path d="M12 20v2"></path>
									<path d="m4.93 4.93 1.41 1.41"></path>
									<path d="m17.66 17.66 1.41 1.41"></path>
									<path d="M2 12h2"></path>
									<path d="M20 12h2"></path>
									<path d="m6.34 17.66-1.41 1.41"></path>
									<path d="m19.07 4.93-1.41 1.41"></path>
								</svg>
							) : (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
								</svg>
							)}
						</button>

						{/* User profile */}
						{isAuthenticated && (
							<div className="relative">
								<button className="h-10 px-2 flex items-center gap-2 rounded-xl bg-slate-200/50 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors text-sm font-medium">
									<span className="hidden sm:inline">
										{user?.name || user?.email?.split('@')[0] || 'User'}
									</span>
									<div className="h-7 w-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
										{user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
									</div>
									{isDevBypass && (
										<span className="absolute -top-2 -right-2 bg-amber-500 text-xs px-1 rounded-full text-white">
											DEV
										</span>
									)}
								</button>
							</div>
						)}

						{/* Mobile menu button */}
						<button
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-slate-200/50 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
							aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
						>
							{isMobileMenuOpen ? (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M18 6 6 18"></path>
									<path d="m6 6 12 12"></path>
								</svg>
							) : (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<line x1="4" x2="20" y1="12" y2="12" />
									<line x1="4" x2="20" y1="6" y2="6" />
									<line x1="4" x2="20" y1="18" y2="18" />
								</svg>
							)}
						</button>
					</div>
				</div>

				{/* Mobile Navigation Menu */}
				{isMobileMenuOpen && (
					<div className="md:hidden pt-4 pb-2 border-t border-slate-200 dark:border-slate-700/50 mt-3">
						<div className="flex flex-col space-y-3">
							{navItems.map(item => (
								<Link
									key={item.href}
									href={item.href}
									className={`px-2 py-2 rounded-lg transition-colors ${
										pathname === item.href
											? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold'
											: 'text-slate-600 dark:text-slate-300 hover:bg-slate-500/10'
									}`}
								>
									{item.label}
								</Link>
							))}
						</div>
					</div>
				)}
			</div>
		</nav>
	);
}
