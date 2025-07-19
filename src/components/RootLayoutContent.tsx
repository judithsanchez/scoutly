'use client';

import {useState} from 'react';
import {DemoModal} from '@/components/DemoModal';
import {usePathname} from 'next/navigation';
import {Navbar} from './Navbar';

export function RootLayoutContent({children}: {children: React.ReactNode}) {
	const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
	const pathname = usePathname();

	const isHomepage = pathname === '/';

	return (
		<>
			{isHomepage && (
				<DemoModal
					isOpen={isDemoModalOpen}
					onClose={() => setIsDemoModalOpen(false)}
				/>
			)}
			<Navbar />
			{children}
		</>
	);
}
