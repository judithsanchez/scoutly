import * as React from 'react';
import {Slot} from '@radix-ui/react-slot';
import styles from './button.module.css';

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'default' | 'outline' | 'ghost';
	size?: 'default' | 'sm' | 'lg';
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className = '',
			variant = 'default',
			size = 'default',
			asChild = false,
			...props
		},
		ref,
	) => {
		const Comp = asChild ? Slot : 'button';
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
			<Comp
				className={`${styles.button} ${variantClass} ${sizeClass} ${className}`}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = 'Button';

export {Button};
