'use client';

import {useState} from 'react';
import {usePathname} from 'next/navigation';
import {ThemeToggle} from './ThemeToggle';
import Link from 'next/link';
import {BrandLogo} from './BrandLogo';
import './Navbar.css';

interface NavbarLink {
	label: string;
	href: string;
	external?: boolean;
	icon?: React.ReactNode;
}

interface NavbarProps {
	onDemoClick?: () => void;
	internalLinks: NavbarLink[];
	homepageLinks: NavbarLink[];
}

export function Navbar({
	onDemoClick,
	internalLinks,
	homepageLinks,
}: NavbarProps) {
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
						{(isInternalPage ? internalLinks : homepageLinks).map(link =>
							link.external ? (
								<a
									key={link.href}
									href={link.href}
									target="_blank"
									rel="noopener noreferrer"
									className="navbar-link hover:text-[var(--text-color)] transition-colors flex items-center gap-2"
								>
									{link.label}
									{link.icon}
								</a>
							) : (
								<Link
									key={link.href}
									href={link.href}
									className={`navbar-link hover:text-[var(--text-color)] transition-colors ${
										isActive(link.href) &&
										isInternalPage &&
										pathname === link.href
											? 'navbar-link-active font-semibold'
											: ''
									}`}
								>
									{link.label}
									{link.icon}
								</Link>
							),
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
							<>
								{onDemoClick && (
									<button onClick={onDemoClick} className="demo-btn sm:block">
										Launch Demo
									</button>
								)}
							</>
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
				{(isInternalPage ? internalLinks : homepageLinks).map(link =>
					link.external ? (
						<a
							key={link.href}
							href={link.href}
							target="_blank"
							rel="noopener noreferrer"
							className="mobile-menu-link"
							onClick={() => setIsMobileMenuOpen(false)}
						>
							{link.label}
							{link.icon}
						</a>
					) : (
						<Link
							key={link.href}
							href={link.href}
							className={`mobile-menu-link ${
								isActive(link.href) && isInternalPage && pathname === link.href
									? 'mobile-menu-link-active font-semibold'
									: ''
							}`}
							onClick={() => setIsMobileMenuOpen(false)}
						>
							{link.label}
							{link.icon}
						</Link>
					),
				)}
				{!isInternalPage && onDemoClick && (
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
			</div>
		</nav>
	);
}
