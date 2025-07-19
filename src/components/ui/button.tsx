import * as React from 'react';
import styles from './button.module.css';

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'default' | 'outline' | 'ghost';
	size?: 'default' | 'sm' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({className = '', variant = 'default', size = 'default', ...props}, ref) => {
		const variantClass =
			variant === 'outline'
				? styles['button-outline']
				: variant === 'ghost'
				? styles['button-ghost']
				: styles['button-default'];
		const sizeClass =
			size === 'sm'
				? styles['button-sm']
				: size === 'lg'
				? styles['button-lg']
				: styles['button-default-size'];
		return (
			<button
				className={`${styles.button} ${variantClass} ${sizeClass} ${className}`}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = 'Button';

export {Button};
