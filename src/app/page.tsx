'use client';

import {useState} from 'react';
import {Navbar} from '@/components/Navbar';
import {LoginModal} from '@/components/LoginModal';
import {HeroSection} from '@/components/HeroSection';
import {HowItWorksSection} from '@/components/HowItWorksSection';

export default function Home() {
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

	const handleLoginClick = () => setIsLoginModalOpen(true);
	const handleModalClose = () => setIsLoginModalOpen(false);

	return (
		<div className="bg-slate-950 text-white overflow-x-hidden">
			<div className="background-glows" />

			<Navbar onLoginClick={handleLoginClick} />
			<LoginModal isOpen={isLoginModalOpen} onClose={handleModalClose} />

			<HeroSection onGetStartedClick={handleLoginClick} />
			<HowItWorksSection />
		</div>
	);
}
