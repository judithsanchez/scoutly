'use client';

export function BrandLogo() {
	return (
		<span className="flex items-center gap-2">
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
			<span className="navbar-title">Scoutly</span>
		</span>
	);
}
