import {NextAuthOptions} from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import {User} from '@/models/User';
import {AdminUser} from '@/models/AdminUser';
import connectToDB from '@/lib/db';

const isProd = process.env.NODE_ENV === 'production';

// --- CRITICAL: Explicit cookie config for cross-domain session sharing ---
const cookieDomain = process.env.NEXTAUTH_COOKIE_DOMAIN || '.jobscoutly.tech';

export const productionAuthOptions: NextAuthOptions = {
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		}),
	],
	callbacks: {
		async signIn({user, account, profile}) {
			try {
				if (!user.email) {
					console.log('Sign-in rejected: No email provided by provider');
					return false;
				}

				const internalApiUrl = process.env.NEXT_PUBLIC_API_URL;
				if (!internalApiUrl) {
					console.error('Internal API URL is not configured.');
					return false;
				}

				const response = await fetch(
					`${internalApiUrl}/api/internal/auth/signin`,
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'X-Internal-API-Secret': process.env.INTERNAL_API_SECRET || '',
						},
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

				// If response is not ok or not approved
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

			// Persist admin status and profile completion in JWT
			if (user || typeof token.hasCompleteProfile === 'undefined') {
				const email = user?.email || token.email;
				if (email) {
					try {
						const internalApiUrl = process.env.NEXT_PUBLIC_API_URL;
						if (!internalApiUrl)
							throw new Error('Internal API URL is not configured.');

						// Fetch user profile from internal API (no session required)
						const profileRes = await fetch(
							`${internalApiUrl}/api/internal/user/profile`,
							{
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
									'X-Internal-API-Secret':
										process.env.INTERNAL_API_SECRET || '',
								},
								body: JSON.stringify({email}),
							},
						);
						let userData = null;
						if (profileRes.ok) {
							userData = await profileRes.json();
						}

						// Fetch admin status from backend API
						const adminRes = await fetch(
							`${internalApiUrl}/api/internal/auth/is-admin`,
							{
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
									'X-Internal-API-Secret':
										process.env.INTERNAL_API_SECRET || '',
								},
								body: JSON.stringify({email}),
							},
						);
						let isAdmin = false;
						if (adminRes.ok) {
							const adminData = await adminRes.json();
							isAdmin = !!adminData.isAdmin;
						}

						const hasCompleteProfile = !!(
							userData?.cvUrl && userData?.candidateInfo
						);

						token.isAdmin = isAdmin;
						token.hasCompleteProfile = hasCompleteProfile;
						token.cvUrl = userData?.cvUrl;
					} catch (error) {
						console.error('Error enriching JWT (via API):', error);
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
