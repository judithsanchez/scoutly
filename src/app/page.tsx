'use client';

import {useState} from 'react';
import {Navbar} from '@/components/Navbar';
import {LoginModal} from '@/components/LoginModal';
import {HeroSection} from '@/components/HeroSection';
import {HowItWorksSection} from '@/components/HowItWorksSection';

export default function Home() {
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

	return (
		<div className="relative">
			<div className="background-glows" />

			<Navbar onLoginClick={() => setIsLoginModalOpen(true)} />
			<LoginModal
				isOpen={isLoginModalOpen}
				onClose={() => setIsLoginModalOpen(false)}
			/>

			<HeroSection />
			<HowItWorksSection />
		</div>
	);
}
