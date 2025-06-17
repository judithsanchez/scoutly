import './globals.css';
import {Inter} from 'next/font/google';
import {Providers} from './providers';
import {RootLayoutContent} from '@/components/RootLayoutContent';

const inter = Inter({
	subsets: ['latin'],
	variable: '--font-inter',
	display: 'swap',
	preload: true,
	weight: ['400', '500', '700', '800'],
});

export const metadata = {
	title: 'Scoutly - Your AI Job Scout',
	description:
		'Let our AI-powered scout find the perfect job opportunities that match your unique skills and experience. Stop searching, start matching.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
	return (
		<html lang="en" className={`${inter.variable}`}>
			<body>
				<Providers>
					{/* Wrap inside the providers to ensure theme context is available */}
					<RootLayoutContent>{children}</RootLayoutContent>
				</Providers>
			</body>
		</html>
	);
}
