import 'next-auth';

declare module 'next-auth' {
	interface Session {
		user: {
			email: string | null;
			name?: string | null;
			image?: string | null;
			isAdmin: boolean;
			hasCompleteProfile: boolean;
			cvUrl?: string;
		};
	}

	interface User {
		email: string;
		isAdmin?: boolean;
		hasCompleteProfile?: boolean;
		cvUrl?: string;
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		email: string;
		isAdmin?: boolean;
		hasCompleteProfile?: boolean;
		cvUrl?: string;
	}
}
