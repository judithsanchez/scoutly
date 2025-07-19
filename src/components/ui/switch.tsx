import * as React from 'react';
import styles from './switch.module.css';

interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	checked?: boolean;
	defaultChecked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
	(
		{
			className = '',
			checked,
			defaultChecked,
			onCheckedChange,
			disabled,
			...props
		},
		ref,
	) => {
		const [internalChecked, setInternalChecked] = React.useState(
			!!defaultChecked,
		);
		const isControlled = typeof checked === 'boolean';
		const isChecked = isControlled ? checked : internalChecked;

		const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
			if (disabled) return;
			const newChecked = !isChecked;
			if (!isControlled) setInternalChecked(newChecked);
			if (onCheckedChange) onCheckedChange(newChecked);
			if (props.onClick) props.onClick(e as any);
		};

		const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
			if (e.key === ' ' || e.key === 'Enter') {
				e.preventDefault();
				handleToggle(e);
			}
			if (props.onKeyDown) props.onKeyDown(e);
		};

		return (
			<button
				type="button"
				role="switch"
				aria-checked={isChecked}
				tabIndex={0}
				disabled={disabled}
				className={`${styles['switch-root']} ${className}`}
				data-state={isChecked ? 'checked' : 'unchecked'}
				onClick={handleToggle}
				onKeyDown={handleKeyDown}
				ref={ref}
				{...props}
			>
				<span className={styles['switch-thumb']} />
			</button>
		);
	},
);
Switch.displayName = 'Switch';

export {Switch};
