import {apiBaseUrl, auth, header, secret} from '@/config';
import {endpoint} from '@/constants';
import {NextAuthOptions} from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import {Logger} from '@/utils/logger';

const logger = new Logger('NextAuthProduction');

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
					await logger.warn('Sign-in rejected: No email provided by provider');
					return false;
				}

				const internalApiUrl = apiBaseUrl.prod;
				if (!internalApiUrl) {
					await logger.error('Internal API URL is not configured.');
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
						await logger.info(
							`Sign-in approved for ${user.email} via internal API`,
						);
						return true;
					}
				}

				await logger.warn(
					`Sign-in rejected for ${user.email} by internal API. Status: ${response.status}`,
				);
				return false;
			} catch (error) {
				await logger.error('Error during sign-in API call:', error);
				return false;
			}
		},
		async session({session, token}) {
			await logger.debug('Session callback started', {
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
			await logger.debug('JWT callback started', {
				tokenEmail: token.email,
				userEmail: user?.email,
				accountProvider: account?.provider,
				accountType: account?.type,
			});

			// DEBUG: Log the incoming token, user, and account
			await logger.info('[JWT DEBUG] Incoming token:', token);
			await logger.info('[JWT DEBUG] Incoming user:', user);
			await logger.info('[JWT DEBUG] Incoming account:', account);

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

						// DEBUG: Log the session data received from the backend
						await logger.info(
							'[JWT DEBUG] Session data from backend:',
							sessionData,
						);

						token.isAdmin = !!sessionData?.isAdmin;
						token.hasCompleteProfile = !!sessionData?.hasCompleteProfile;
						token.cvUrl = sessionData?.cvUrl;
						await logger.info('JWT enriched from session API', {
							email,
							isAdmin: token.isAdmin,
							hasCompleteProfile: token.hasCompleteProfile,
							cvUrl: token.cvUrl,
						});
					} catch (error) {
						await logger.error(
							'Error enriching JWT (via AuthService API):',
							error,
						);
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
