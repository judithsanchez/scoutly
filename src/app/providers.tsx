'use client';

import {ThemeProvider as NextThemeProvider} from 'next-themes';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {useState} from 'react';

export function Providers({children}: {children: React.ReactNode}) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 1000 * 60 * 5, // Data is considered fresh for 5 minutes
						gcTime: 1000 * 60 * 30, // Cache will be garbage collected after 30 minutes
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<NextThemeProvider
				defaultTheme="dark"
				attribute="class"
				enableSystem={false}
			>
				{children}
			</NextThemeProvider>
		</QueryClientProvider>
	);
}
