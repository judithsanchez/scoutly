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

	// Only show demo button and background gradient on homepage
	const isHomepage = pathname === '/';

	return (
		<>
			{/* Only render the background gradients on the homepage */}
			{isHomepage && (
				<div
					className="fixed inset-0 z-[-1]"
					style={{
						backgroundImage: `radial-gradient(circle at 15% 25%, rgba(168, 85, 247, 0.6), transparent 50%),
							radial-gradient(circle at 85% 85%, rgba(236, 72, 153, 0.6), transparent 50%),
							radial-gradient(circle at 50% 50%, rgba(79, 70, 229, 0.4), transparent 50%)`,
						animation: 'move-glows 30s ease-in-out infinite',
						backgroundAttachment: 'fixed',
						backgroundSize: '200% 200%',
					}}
					aria-hidden="true"
				/>
			)}

			<Navbar
				onDemoClick={isHomepage ? () => setIsDemoModalOpen(true) : undefined}
			/>
			<LoginModal
				isOpen={isLoginModalOpen}
				onClose={() => setIsLoginModalOpen(false)}
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
