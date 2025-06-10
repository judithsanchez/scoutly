'use client';

import {useState, useEffect} from 'react';
import {Navbar} from '@/components/Navbar';
import {LoginModal} from '@/components/LoginModal';

export function RootLayoutContent({children}: {children: React.ReactNode}) {
	const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	useEffect(() => {
		// For test purposes, check if we're logged in using the endpoint
		fetch('/api/users/check-auth')
			.then(res => res.json())
			.then(data => {
				setIsLoggedIn(data.isAuthorized);
			})
			.catch(() => {
				setIsLoggedIn(false);
			});
	}, []);

	return (
		<>
			<Navbar
				onLoginClick={() => setIsLoginModalOpen(true)}
				isLoggedIn={isLoggedIn}
			/>
			<LoginModal
				isOpen={isLoginModalOpen}
				onClose={() => setIsLoginModalOpen(false)}
			/>
			{children}
		</>
	);
}
