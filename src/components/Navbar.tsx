'use client';

import {useState} from 'react';
import {usePathname} from 'next/navigation';
import {ThemeToggle} from './ThemeToggle';
import Link from 'next/link';
import {BrandLogo} from './BrandLogo';
import './Navbar.css';

interface NavbarProps {
	onDemoClick?: () => void;
}

export function Navbar({onDemoClick}: NavbarProps) {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const pathname = usePathname();

	const isHomepage = pathname === '/';
	const isInternalPage =
		!isHomepage && pathname !== '/auth/signin' && pathname !== '/auth/signup';

	const isActive = (path: string) => {
		return pathname === path || pathname?.startsWith(path + '/');
	};

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	return (
		<nav className="navbar">
			<div className="nav-card">
				<div className="navbar-content">
					<Link
						href={isInternalPage ? '/dashboard' : '/'}
						className="flex items-center gap-2"
					>
						<BrandLogo />
					</Link>
					<div className="navbar-links md:flex items-center gap-6 text-sm font-medium">
						{isInternalPage ? (
							<>
								<Link
									href="/dashboard"
									className={`navbar-link hover:text-[var(--text-color)] transition-colors ${
										isActive('/dashboard') && pathname === '/dashboard'
											? 'navbar-link-active font-semibold'
											: ''
									}`}
								>
									Dashboard
								</Link>
								<Link
									href="/saved-jobs"
									className={`navbar-link hover:text-[var(--text-color)] transition-colors ${
										isActive('/saved-jobs')
											? 'navbar-link-active font-semibold'
											: ''
									}`}
								>
									Saved Jobs
								</Link>
								<Link
									href="/companies"
									className={`navbar-link hover:text-[var(--text-color)] transition-colors ${
										isActive('/companies')
											? 'navbar-link-active font-semibold'
											: ''
									}`}
								>
									Companies
								</Link>
								<Link
									href="/admin"
									className={`navbar-link hover:text-[var(--text-color)] transition-colors ${
										isActive('/admin') ? 'navbar-link-active font-semibold' : ''
									}`}
								>
									Admin
								</Link>
							</>
						) : (
							<>
								<a
									href="#how-it-works"
									className="navbar-link hover:text-[var(--text-color)] transition-colors"
								>
									How It Works
								</a>
								<a
									href="#about-project"
									className="navbar-link hover:text-[var(--text-color)] transition-colors"
								>
									About this Project
								</a>
								<a
									href="https://github.com/judithsanchez/scoutly"
									target="_blank"
									rel="noopener noreferrer"
									className="navbar-link hover:text-[var(--text-color)] transition-colors flex items-center gap-2"
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
							<Link
								href="/profile"
								className="profile-btn"
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
							onDemoClick && (
								<button onClick={onDemoClick} className="demo-btn sm:block">
									Launch Demo
								</button>
							)
						)}
						<button
							onClick={toggleMobileMenu}
							className="menu-btn md:hidden"
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
			<div
				className={`mobile-menu md:hidden mt-2 ${
					isMobileMenuOpen ? 'open' : ''
				}`}
			>
				{isInternalPage ? (
					<>
						<Link
							href="/dashboard"
							className={`mobile-menu-link ${
								isActive('/dashboard') && pathname === '/dashboard'
									? 'mobile-menu-link-active font-semibold'
									: ''
							}`}
							onClick={() => setIsMobileMenuOpen(false)}
						>
							Dashboard
						</Link>
						<Link
							href="/saved-jobs"
							className={`mobile-menu-link ${
								isActive('/saved-jobs')
									? 'mobile-menu-link-active font-semibold'
									: ''
							}`}
							onClick={() => setIsMobileMenuOpen(false)}
						>
							Saved Jobs
						</Link>
						<Link
							href="/companies"
							className={`mobile-menu-link ${
								isActive('/companies')
									? 'mobile-menu-link-active font-semibold'
									: ''
							}`}
							onClick={() => setIsMobileMenuOpen(false)}
						>
							Companies
						</Link>
						<Link
							href="/admin"
							className={`mobile-menu-link ${
								isActive('/admin')
									? 'mobile-menu-link-active font-semibold'
									: ''
							}`}
							onClick={() => setIsMobileMenuOpen(false)}
						>
							Admin
						</Link>
					</>
				) : (
					<>
						<a
							href="#how-it-works"
							className="mobile-menu-link"
							onClick={() => setIsMobileMenuOpen(false)}
						>
							How It Works
						</a>
						<a
							href="#about-project"
							className="mobile-menu-link"
							onClick={() => setIsMobileMenuOpen(false)}
						>
							About this Project
						</a>
						<a
							href="https://github.com/judithsanchez/scoutly"
							target="_blank"
							rel="noopener noreferrer"
							className="mobile-menu-link"
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
								className="demo-btn w-full mt-4"
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
