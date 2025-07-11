// /src/lib/auth.ts
import {NextAuthOptions, User as NextAuthUser} from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import {apiBaseUrl, secret, auth} from '@/config/environment';

interface CustomUser extends NextAuthUser {
	id: string;
	role?: string;
	isProfileComplete?: boolean;
}

export const authOptions: NextAuthOptions = {
	providers: [
		GoogleProvider({
			clientId: auth.googleClientId || '',
			clientSecret: auth.googleClientSecret || '',
		}),
	],
	session: {
		strategy: 'jwt',
	},
	callbacks: {
		/**
		 * This callback is triggered when a user tries to sign in.
		 * Uses the API proxy endpoint to check if the user is pre-approved.
		 */
		async signIn({user}) {
			if (!user.email) return false;
			try {
				const response = await fetch(
					`${apiBaseUrl.prod}/internal/verify-user`,
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'x-internal-secret': secret.internalApiSecret || '',
						},
						body: JSON.stringify({email: user.email}),
					},
				);
				if (!response.ok) return false;
				const data = await response.json();
				return !!data.exists;
			} catch (err) {
				console.error('signIn API proxy error:', err);
				return false;
			}
		},
		/**
		 * This callback is called whenever a JWT is created (i.e., at sign in).
		 * Uses the API proxy endpoint to fetch user details.
		 */
		async jwt({token, user}) {
			if (user?.email) {
				try {
					const response = await fetch(
						`${
							apiBaseUrl.prod
						}/internal/user-details?email=${encodeURIComponent(user.email)}`,
						{
							method: 'GET',
							headers: {
								'x-internal-secret': secret.internalApiSecret || '',
							},
						},
					);
					if (response.ok) {
						const userDetails = await response.json();
						token.id = userDetails.id;
						token.role = userDetails.role;
						token.isProfileComplete = userDetails.isProfileComplete;
					}
				} catch (err) {
					console.error('jwt API proxy error:', err);
				}
			}
			return token;
		},
		/**
		 * This callback is called whenever a session is checked.
		 * We pass the data from the token to the client-side session object.
		 */
		async session({session, token}) {
			if (session.user) {
				const customUser = session.user as CustomUser;
				customUser.id = token.id as string;
				customUser.role = token.role as string;
				customUser.isProfileComplete = token.isProfileComplete as boolean;
			}
			return session;
		},
	},
	pages: {
		signIn: '/auth/signin',
		error: '/auth/error',
	},
};
