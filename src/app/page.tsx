'use client';

import {signIn, signOut, useSession} from 'next-auth/react';
import {Button} from '@/components/ui/button';

export default function Home() {
	const {data: session} = useSession();

	return (
		<main className="flex min-h-screen flex-col items-center justify-between p-24">
			<div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
				<h1 className="text-4xl font-bold mb-8">Welcome to Scoutly</h1>

				<div className="mb-8">
					{session ? (
						<div className="space-y-4">
							<p>Signed in as {session.user.email}</p>
							<Button onClick={() => signOut()}>Sign Out</Button>
						</div>
					) : (
						<Button onClick={() => signIn('google')}>
							Sign in with Google
						</Button>
					)}
				</div>
			</div>
		</main>
	);
}
