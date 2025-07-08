import {apiBaseUrl, auth, header, secret} from '@/config';
import {endpoint} from '@/constants';
import {NextAuthOptions} from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const isProd = process.env.NODE_ENV === 'production';

const cookieDomain = process.env.NEXTAUTH_COOKIE_DOMAIN || '.jobscoutly.tech';

export const productionAuthOptions: NextAuthOptions = {
	providers: [
		GoogleProvider({
			clientId: auth.googleClientId!,
			clientSecret: auth.googleClientSecret!,
		}),
	],
	callbacks: {
		async signIn({user, account, profile}) {
			try {
				if (!user.email) {
					console.log('Sign-in rejected: No email provided by provider');
					return false;
				}

				const internalApiUrl = apiBaseUrl.prod;
				if (!internalApiUrl) {
					console.error('Internal API URL is not configured.');
					return false;
				}

				const response = await fetch(
					`${internalApiUrl}${endpoint.auth.signin}`,
					{
						method: 'POST',
						headers: new Headers({
							[header.internalApiSecret]: secret.internalApiSecret ?? '',
						}),
						body: JSON.stringify({email: user.email}),
					},
				);

				if (response.ok) {
					const data = await response.json();
					if (data.approved) {
						console.log(`Sign-in approved for ${user.email} via internal API`);
						return true;
					}
				}

				console.log(
					`Sign-in rejected for ${user.email} by internal API. Status: ${response.status}`,
				);
				return false;
			} catch (error) {
				console.error('Error during sign-in API call:', error);
				return false;
			}
		},
		async session({session, token}) {
			console.log('🔍 Session callback started:', {
				sessionUser: session.user?.email,
			});

			if (session.user) {
				session.user.isAdmin = token.isAdmin as boolean;
				session.user.hasCompleteProfile = token.hasCompleteProfile as boolean;
				session.user.cvUrl = token.cvUrl as string | undefined;
			}
			return session;
		},
		async jwt({token, user, account}) {
			console.log('🔍 JWT callback started:', {
				tokenEmail: token.email,
				userEmail: user?.email,
				accountProvider: account?.provider,
				accountType: account?.type,
			});

			// Use AuthService for all user/admin/profile checks via backend API
			if (user || typeof token.hasCompleteProfile === 'undefined') {
				const email = user?.email || token.email;
				if (email) {
					try {
						const internalApiUrl = apiBaseUrl.prod;
						if (!internalApiUrl)
							throw new Error('Internal API URL is not configured.');

						// Use a single endpoint to get all session info
						const sessionRes = await fetch(
							`${internalApiUrl}${endpoint.auth.session}`,
							{
								method: 'POST',
								headers: new Headers({
									[header.internalApiSecret]: secret.internalApiSecret ?? '',
									'Content-Type': 'application/json',
								}),
								body: JSON.stringify({email}),
							},
						);
						let sessionData = null;
						if (sessionRes.ok) {
							sessionData = await sessionRes.json();
						}

						token.isAdmin = !!sessionData?.isAdmin;
						token.hasCompleteProfile = !!sessionData?.hasCompleteProfile;
						token.cvUrl = sessionData?.cvUrl;
					} catch (error) {
						console.error('Error enriching JWT (via AuthService API):', error);
						token.isAdmin = false;
						token.hasCompleteProfile = false;
					}
				}
			}
			return token;
		},
	},
	pages: {
		signIn: '/auth/signin',
		error: '/auth/error',
	},
	session: {
		strategy: 'jwt',
	},
	cookies: isProd
		? {
				sessionToken: {
					name: `__Secure-next-auth.session-token`,
					options: {
						domain: cookieDomain,
						path: '/',
						httpOnly: true,
						sameSite: 'lax',
						secure: true,
					},
				},
				callbackUrl: {
					name: `__Secure-next-auth.callback-url`,
					options: {
						domain: cookieDomain,
						path: '/',
						sameSite: 'lax',
						secure: true,
					},
				},
				csrfToken: {
					name: `__Host-next-auth.csrf-token`,
					options: {
						domain: cookieDomain,
						path: '/',
						httpOnly: true,
						sameSite: 'lax',
						secure: true,
					},
				},
		  }
		: undefined,
	useSecureCookies: isProd,
};
