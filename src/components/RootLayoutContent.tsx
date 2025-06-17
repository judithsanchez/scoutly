'use client';

import {useState} from 'react';
import {Navbar} from '@/components/Navbar';
import {LoginModal} from '@/components/LoginModal';
import {DemoModal} from '@/components/DemoModal';
import {usePathname} from 'next/navigation';

export function RootLayoutContent({children}: {children: React.ReactNode}) {
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
	const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
	const pathname = usePathname();

	// Only show demo button on homepage
	const isHomepage = pathname === '/';

	return (
		<>
			<Navbar
				onDemoClick={isHomepage ? () => setIsDemoModalOpen(true) : undefined}
			/>
			<LoginModal
				isOpen={isLoginModalOpen}
				onClose={() => setIsLoginModalOpen(false)}
			/>
			<DemoModal
				isOpen={isDemoModalOpen}
				onClose={() => setIsDemoModalOpen(false)}
			/>
			{children}
		</>
	);
}
