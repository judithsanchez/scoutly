import * as React from 'react';
import styles from './label.module.css';

const Label = React.forwardRef<
	React.ElementRef<'label'>,
	React.ComponentPropsWithoutRef<'label'>
>(({className = '', ...props}, ref) => (
	<label ref={ref} className={`${styles.label} ${className}`} {...props} />
));
Label.displayName = 'Label';

export {Label};
