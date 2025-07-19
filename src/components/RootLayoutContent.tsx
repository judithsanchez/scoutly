'use client';

import {useState} from 'react';
import {DemoModal} from '@/components/DemoModal';
import {usePathname} from 'next/navigation';
import {Navbar} from './Navbar';

export function RootLayoutContent({children}: {children: React.ReactNode}) {
	const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
	const pathname = usePathname();

	const isHomepage = pathname === '/';

	const internalLinks = [
		{label: 'Dashboard', href: '/dashboard'},
		{label: 'Saved Jobs', href: '/saved-jobs'},
		{label: 'Companies', href: '/companies'},
		{label: 'Admin', href: '/admin'},
	];

	const homepageLinks = [
		{label: 'How It Works', href: '#how-it-works'},
		{label: 'About this Project', href: '#about-project'},
		{
			label: 'GitHub',
			href: 'https://github.com/judithsanchez/scoutly',
			external: true,
		},
	];

	return (
		<>
			{isHomepage && (
				<DemoModal
					isOpen={isDemoModalOpen}
					onClose={() => setIsDemoModalOpen(false)}
				/>
			)}
			<Navbar
				onDemoClick={isHomepage ? () => setIsDemoModalOpen(true) : undefined}
				internalLinks={internalLinks}
				homepageLinks={homepageLinks}
			/>
			{children}
		</>
	);
}
