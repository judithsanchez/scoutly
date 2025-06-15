import {describe, expect, it} from 'vitest';
import {render, screen} from '@testing-library/react';
import {ThemeToggle} from '@/components/ThemeToggle';
import {ThemeProvider} from 'next-themes';

describe('ThemeToggle', () => {
	it('renders the theme toggle button with correct aria-label', () => {
		render(
			<ThemeProvider>
				<ThemeToggle />
			</ThemeProvider>,
		);

		const button = screen.getByRole('button', {name: /toggle theme/i});
		expect(button).toBeInTheDocument();
	});
});
