'use client';

import {SessionProvider} from 'next-auth/react';
import {ThemeProvider as NextThemeProvider} from 'next-themes';

export function Providers({children}: {children: React.ReactNode}) {
	return (
		<NextThemeProvider defaultTheme="dark" attribute="class">
			<SessionProvider>{children}</SessionProvider>
		</NextThemeProvider>
	);
}
