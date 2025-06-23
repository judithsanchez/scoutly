'use client';

import {useSearchParams, useRouter} from 'next/navigation';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {AlertCircle, ArrowLeft, Mail} from 'lucide-react';

const errorMessages = {
	AccessDenied: {
		title: 'Access Denied',
		description:
			'Your account is not authorized to access Scoutly. Please contact an administrator to request access.',
		icon: AlertCircle,
	},
	Configuration: {
		title: 'Configuration Error',
		description:
			'There was a problem with the authentication configuration. Please try again later.',
		icon: AlertCircle,
	},
	Verification: {
		title: 'Verification Required',
		description: 'Please check your email and follow the verification link.',
		icon: Mail,
	},
	Default: {
		title: 'Authentication Error',
		description:
			'An unexpected error occurred during authentication. Please try again.',
		icon: AlertCircle,
	},
};

export default function AuthErrorPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const error = searchParams.get('error') || 'Default';

	const errorInfo =
		errorMessages[error as keyof typeof errorMessages] || errorMessages.Default;
	const Icon = errorInfo.icon;

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
						<Icon className="h-6 w-6 text-red-600 dark:text-red-400" />
					</div>
					<CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
						{errorInfo.title}
					</CardTitle>
					<CardDescription className="text-gray-600 dark:text-gray-400">
						{errorInfo.description}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{error === 'AccessDenied' && (
						<div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
							<div className="text-sm text-blue-800 dark:text-blue-200">
								<p className="font-medium">Need access?</p>
								<p>
									Contact your administrator with your email address to be added
									to the system.
								</p>
							</div>
						</div>
					)}

					<div className="flex flex-col space-y-2">
						<Button
							onClick={() => router.push('/auth/signin')}
							variant="default"
							className="w-full"
						>
							Try Again
						</Button>
						<Button
							onClick={() => router.push('/')}
							variant="outline"
							className="w-full"
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Go Home
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
