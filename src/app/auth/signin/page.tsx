'use client';

import {signIn} from 'next-auth/react';
import {Button} from '@/components/ui/button';

export default function SignIn() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-24">
			<div className="w-full max-w-sm space-y-4">
				<div className="text-center">
					<h1 className="text-2xl font-bold">Welcome to Scoutly</h1>
					<p className="text-gray-600">Sign in to continue</p>
				</div>
				<Button
					onClick={() => signIn('google', {callbackUrl: '/dashboard', prompt: 'select_account'})}
					className="w-full"
				>
					Sign in with Google
				</Button>
			</div>
		</div>
	);
}
