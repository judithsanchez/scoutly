'use client';

import {useEffect} from 'react';
import {useTheme} from 'next-themes';

export function HomepageBackground() {
	const {theme} = useTheme();

	useEffect(() => {
		// Force repaint on mount
		const timeout = setTimeout(() => {
			document.documentElement.classList.add('has-homepage-loaded');
		}, 100);

		return () => {
			clearTimeout(timeout);
			document.documentElement.classList.remove('has-homepage-loaded');
		};
	}, []);

	return (
		<>
			{/* Single background layer matching exactly the reference design */}
			<div className="background-glows" aria-hidden="true" />
		</>
	);
}
