'use client';

import {useState} from 'react';
import {usePathname} from 'next/navigation';
import {ThemeToggle} from './ThemeToggle';
import Link from 'next/link';
import './navbar.css';

interface NavbarProps {
	onDemoClick?: () => void;
}

export function Navbar({onDemoClick}: NavbarProps) {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const pathname = usePathname();

	// Check if we're on the homepage vs internal pages
	const isHomepage = pathname === '/';

	// Check if we're on an internal page
	const isInternalPage =
		!isHomepage && pathname !== '/auth/signin' && pathname !== '/auth/signup';

	// For internal navigation active state
	const isActive = (path: string) => {
		return pathname === path || pathname?.startsWith(path + '/');
	};

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	return (
		<nav className="fixed top-0 left-0 right-0 px-4 mt-4 z-40">
			<div className="nav-card mx-auto p-3 rounded-2xl border shadow-lg backdrop-blur-xl max-w-7xl bg-[var(--nav-bg)] border-[var(--nav-border)]">
				<div className="flex justify-between items-center">
					<Link
						href={isInternalPage ? '/dashboard' : '/'}
						className="flex items-center gap-2"
					>
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
						<span className="text-2xl font-bold tracking-tighter text-[var(--text-color)]">
							Scoutly
						</span>
					</Link>

					{/* Desktop Navigation */}
					<div className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--text-muted)]">
						{isInternalPage ? (
							// Internal pages navigation
							<>
								<Link
									href="/dashboard"
									className={`hover:text-[var(--text-color)] transition-colors ${
										isActive('/dashboard') && pathname === '/dashboard'
											? 'text-[var(--text-color)] font-semibold'
											: ''
									}`}
								>
									Dashboard
								</Link>
								<Link
									href="/saved-jobs"
									className={`hover:text-[var(--text-color)] transition-colors ${
										isActive('/saved-jobs')
											? 'text-[var(--text-color)] font-semibold'
											: ''
									}`}
								>
									Saved Jobs
								</Link>
								<Link
									href="/companies"
									className={`hover:text-[var(--text-color)] transition-colors ${
										isActive('/companies')
											? 'text-[var(--text-color)] font-semibold'
											: ''
									}`}
								>
									Companies
								</Link>
								<Link
									href="/profile"
									className={`hover:text-[var(--text-color)] transition-colors ${
										isActive('/profile')
											? 'text-[var(--text-color)] font-semibold'
											: ''
									}`}
								>
									Profile
								</Link>
							</>
						) : (
							// Homepage navigation
							<>
								<a
									href="#how-it-works"
									className="hover:text-[var(--text-color)] transition-colors"
								>
									How It Works
								</a>
								<a
									href="#about-project"
									className="hover:text-[var(--text-color)] transition-colors"
								>
									About this Project
								</a>
								<a
									href="https://github.com/judithsanchez/scoutly"
									target="_blank"
									rel="noopener noreferrer"
									className="hover:text-[var(--text-color)] transition-colors flex items-center gap-1.5"
								>
									GitHub
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
										<polyline points="15 3 21 3 21 9"></polyline>
										<line x1="10" y1="14" x2="21" y2="3"></line>
									</svg>
								</a>
							</>
						)}
					</div>

					<div className="flex items-center gap-2">
						<ThemeToggle />

						{isInternalPage ? (
							// Profile icon on internal pages
							<Link
								href="/profile"
								className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-500/10 dark:bg-white/10 hover:bg-slate-500/20 dark:hover:bg-white/20 transition-colors"
								aria-label="User profile"
							>
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
									className="text-[var(--toggle-icon-color)]"
								>
									<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
									<circle cx="12" cy="7" r="4"></circle>
								</svg>
							</Link>
						) : (
							// Demo button on homepage
							onDemoClick && (
								<button
									onClick={onDemoClick}
									className="hidden sm:block px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover-bg)] transition-colors shadow-md"
								>
									Launch Demo
								</button>
							)
						)}

						<button
							onClick={toggleMobileMenu}
							className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-slate-500/10 dark:bg-white/10 hover:bg-slate-500/20 dark:hover:bg-white/20 transition-colors"
							aria-label="Open menu"
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
								className="h-5 w-5 text-[var(--toggle-icon-color)]"
							>
								<line x1="4" x2="20" y1="12" y2="12" />
								<line x1="4" x2="20" y1="6" y2="6" />
								<line x1="4" x2="20" y1="18" y2="18" />
							</svg>
						</button>
					</div>
				</div>
			</div>

			{/* Mobile Menu (slides in from top) */}
			<div
				className={`mobile-menu md:hidden mt-2 bg-[var(--nav-bg)] border-[var(--nav-border)] rounded-2xl border shadow-lg backdrop-blur-xl p-4 ${
					isMobileMenuOpen ? 'open' : ''
				}`}
			>
				{isInternalPage ? (
					// Internal pages mobile navigation
					<>
						<Link
							href="/dashboard"
							className={`block py-2 text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors ${
								isActive('/dashboard') && pathname === '/dashboard'
									? 'text-[var(--text-color)] font-semibold'
									: ''
							}`}
							onClick={() => setIsMobileMenuOpen(false)}
						>
							Dashboard
						</Link>
						<Link
							href="/saved-jobs"
							className={`block py-2 text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors ${
								isActive('/saved-jobs')
									? 'text-[var(--text-color)] font-semibold'
									: ''
							}`}
							onClick={() => setIsMobileMenuOpen(false)}
						>
							Saved Jobs
						</Link>
						<Link
							href="/companies"
							className={`block py-2 text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors ${
								isActive('/companies')
									? 'text-[var(--text-color)] font-semibold'
									: ''
							}`}
							onClick={() => setIsMobileMenuOpen(false)}
						>
							Companies
						</Link>
						<Link
							href="/profile"
							className={`block py-2 text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors ${
								isActive('/profile')
									? 'text-[var(--text-color)] font-semibold'
									: ''
							}`}
							onClick={() => setIsMobileMenuOpen(false)}
						>
							Profile
						</Link>
					</>
				) : (
					// Homepage mobile navigation
					<>
						<a
							href="#how-it-works"
							className="block py-2 text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors"
							onClick={() => setIsMobileMenuOpen(false)}
						>
							How It Works
						</a>
						<a
							href="#about-project"
							className="block py-2 text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors"
							onClick={() => setIsMobileMenuOpen(false)}
						>
							About this Project
						</a>
						<a
							href="https://github.com/judithsanchez/scoutly"
							target="_blank"
							rel="noopener noreferrer"
							className="block py-2 text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors"
							onClick={() => setIsMobileMenuOpen(false)}
						>
							GitHub
						</a>
						{onDemoClick && (
							<button
								onClick={() => {
									onDemoClick();
									setIsMobileMenuOpen(false);
								}}
								className="w-full mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover-bg)] transition-colors shadow-md"
							>
								Launch Demo
							</button>
						)}
					</>
				)}
			</div>
		</nav>
	);
}
