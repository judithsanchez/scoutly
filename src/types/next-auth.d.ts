import 'next-auth';

declare module 'next-auth' {
	interface Session {
		user: {
			email: string | null;
		};
	}

	interface User {
		email: string;
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		email: string;
	}
}
