import * as React from 'react';
import {Slot} from '@radix-ui/react-slot';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '@/lib/utils';

const buttonVariants = cva(
	'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50',
	{
		variants: {
			variant: {
				default:
					'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg hover:scale-105 hover:shadow-xl hover:opacity-90',
				outline:
					'border-2 border-indigo-500 bg-transparent text-indigo-500 hover:bg-indigo-50',
				ghost: 'hover:bg-indigo-50 text-indigo-500',
			},
			size: {
				default: 'h-12 px-6 py-3 text-base',
				sm: 'h-9 rounded-lg px-4 text-sm',
				lg: 'h-14 rounded-xl px-8 text-lg',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({className, variant, size, asChild = false, ...props}, ref) => {
		const Comp = asChild ? Slot : 'button';
		return (
			<Comp
				className={cn(buttonVariants({variant, size, className}))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = 'Button';

export {Button, buttonVariants};
