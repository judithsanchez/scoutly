import React from 'react';

interface DemoModalIconProps {
	className?: string;
}

export function DemoModalIcon({className = ''}: DemoModalIconProps) {
	return (
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
			className={className}
		>
			<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.84l8.57 3.92a2 2 0 0 0 1.66 0l8.57-3.92a1 1 0 0 0 0-1.84Z" />
			<path d="m22 17.65-8.57-3.92a2 2 0 0 0-1.66 0L3.2 17.65a1 1 0 0 0 0 1.84l8.57 3.92a2 2 0 0 0 1.66 0l8.57-3.92a1 1 0 0 0 0-1.84Z" />
			<path d="M3.2 6.08 12 10.01l8.8-3.93" />
			<path d="M12 22.08V12" />
		</svg>
	);
}
