'use client';

import {useState} from 'react';
import {Navbar} from '@/components/Navbar';
import {DemoModal} from '@/components/DemoModal';
import {usePathname} from 'next/navigation';

export function RootLayoutContent({children}: {children: React.ReactNode}) {
	const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
	const pathname = usePathname();

	// Only show demo button and background gradient on homepage
	const isHomepage = pathname === '/';

	return (
		<>
			<Navbar
				onDemoClick={isHomepage ? () => setIsDemoModalOpen(true) : undefined}
			/>
			{isHomepage && (
				<DemoModal
					isOpen={isDemoModalOpen}
					onClose={() => setIsDemoModalOpen(false)}
				/>
			)}
			{children}
		</>
	);
}
