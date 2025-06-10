'use client';

import {signIn} from 'next-auth/react';
import {useRouter} from 'next/navigation';

interface LoginModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function LoginModal({isOpen, onClose}: LoginModalProps) {
	const router = useRouter();

	if (!isOpen) return null;

	const handleSignIn = async () => {
		await signIn('google', {callbackUrl: '/dashboard'});
	};

	const handleTestLogin = () => {
		console.log('Attempting to navigate to dashboard...');
		onClose(); // Close the modal before navigation
		window.location.href = '/dashboard';
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="fixed inset-0 bg-black/50 modal-enter"
				onClick={onClose}
			/>

			<div className="relative w-full max-w-md p-8 rounded-2xl border border-border/20 bg-background/80 shadow-2xl backdrop-blur-2xl modal-content-enter">
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>

				<div className="text-center">
					<h2 className="text-3xl font-bold mb-2">Welcome to Scoutly</h2>
					<p className="text-muted-foreground mb-8">
						Sign in with your Google account to get started.
					</p>

					<div className="space-y-4">
						<button
							onClick={handleSignIn}
							className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md"
						>
							<svg
								className="w-5 h-5"
								viewBox="0 0 48 48"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M47.532 24.552c0-1.584-.144-3.12-.42-4.608H24.27v8.712h13.068c-.564 2.82-2.196 5.22-4.608 6.804v5.616h7.236c4.224-3.9,6.624-9.612,6.624-16.524z"
									fill="#4285F4"
								/>
								<path
									d="M24.27 48.001c6.444 0 11.856-2.124 15.804-5.76l-7.236-5.616c-2.136 1.44-4.86 2.292-8.568 2.292-6.588 0-12.168-4.428-14.184-10.332H2.742v5.796C6.726 42.817 14.85 48.001 24.27 48.001z"
									fill="#34A853"
								/>
								<path
									d="M10.086 28.921c-.6-1.8-1-3.696-1-5.652s.4-3.852 1-5.652V11.82H2.742C1.038 15.253 0 19.537 0 24.27s1.038 9.016 2.742 12.456l7.344-5.805z"
									fill="#FBBC04"
								/>
								<path
									d="M24.27 9.481c3.492 0 6.66.996 9.144 3.3l6.408-6.408C36.126 2.677 30.714 0 24.27 0 14.85 0 6.726 5.184 2.742 11.82l7.344 5.796C12.102 13.909 17.682 9.481 24.27 9.481z"
									fill="#EA4335"
								/>
							</svg>
							<span>Sign in with Google</span>
						</button>

						<button
							onClick={handleTestLogin}
							className="w-full px-6 py-3 rounded-xl font-semibold bg-gray-600 text-white hover:bg-gray-700 transition-colors shadow-md"
						>
							Test Login as judithv.sanchezc@gmail.com
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
