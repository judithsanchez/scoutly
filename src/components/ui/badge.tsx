import * as React from 'react';
import styles from './badge.module.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

function Badge({className = '', variant = 'default', ...props}: BadgeProps) {
	const variantClass =
		variant === 'secondary'
			? styles['badge-secondary']
			: variant === 'destructive'
			? styles['badge-destructive']
			: variant === 'outline'
			? styles['badge-outline']
			: styles['badge-default'];
	return (
		<div
			className={`${styles.badge} ${variantClass} ${className}`}
			{...props}
		/>
	);
}

export {Badge};
