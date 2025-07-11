// /src/lib/auth.ts
import {NextAuthOptions, User as NextAuthUser} from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import {apiBaseUrl, secret, auth} from '@/config/environment';
import {logger} from '@/utils/logger';

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
				logger.info('[auth/signIn] Verifying user via API proxy', {
					email: user.email,
				});
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
				logger.debug('[auth/signIn] API proxy response', {
					status: response.status,
				});
				if (!response.ok) {
					const text = await response.text();
					logger.error('[auth/signIn] API proxy error response', {
						status: response.status,
						body: text,
					});
					return false;
				}
				const data = await response.json();
				logger.info('[auth/signIn] User verification result', {
					exists: data.exists,
					email: user.email,
				});
				return !!data.exists;
			} catch (err) {
				logger.error('[auth/signIn] API proxy error', {
					error: err,
					email: user.email,
				});
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
					logger.info('[auth/jwt] Fetching user details via API proxy', {
						email: user.email,
					});
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
					logger.debug('[auth/jwt] API proxy response', {
						status: response.status,
					});
					if (response.ok) {
						const userDetails = await response.json();
						logger.info('[auth/jwt] User details fetched', {userDetails});
						token.id = userDetails.id;
						token.role = userDetails.role;
						token.isProfileComplete = userDetails.isProfileComplete;
					} else {
						const text = await response.text();
						logger.error('[auth/jwt] API proxy error response', {
							status: response.status,
							body: text,
						});
					}
				} catch (err) {
					logger.error('[auth/jwt] API proxy error', {
						error: err,
						email: user.email,
					});
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
				logger.debug('[auth/session] Session hydrated from token', {
					id: customUser.id,
					role: customUser.role,
					isProfileComplete: customUser.isProfileComplete,
				});
			}
			return session;
		},
	},
	pages: {
		signIn: '/auth/signin',
		error: '/auth/error',
	},
};
