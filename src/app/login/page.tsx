'use client';

import LoginForm from '@/components/LoginForm';
import {Navbar} from '@/components/Navbar';

export default function LoginPage() {
	return (
		<>
			<Navbar />
			<main className="flex flex-col items-center justify-center min-h-[80vh] bg-background">
				<div className="w-full max-w-md p-8 mt-8 bg-white rounded-lg shadow-md border border-gray-200">
					<h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
					<LoginForm />
				</div>
			</main>
		</>
	);
}
