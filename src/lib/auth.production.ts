import {NextAuthOptions, User, Session, Account} from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import {
	env,
	deployment,
	apiBaseUrl,
	header,
	secret,
	auth as envAuth,
} from '@/config';

const isVercel = env.isProd && deployment.isVercel;
const isPi = env.isProd && deployment.isPi;

export const productionAuthOptions: NextAuthOptions = {
	providers: [
		GoogleProvider({
			clientId: envAuth.googleClientId!,
			clientSecret: envAuth.googleClientSecret!,
		}),
	],
	secret: envAuth.nextAuthSecret,
	callbacks: {
		async signIn({user, account, profile, email, credentials}) {
			if (isVercel) {
				// Proxy sign-in approval to Pi backend
				try {
					const res = await fetch(
						`${apiBaseUrl.prod}/api/internal/auth/signin`,
						{
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								[header.internalApiSecret]: secret.internalApiSecret ?? '',
							},
							body: JSON.stringify({email: user.email}),
						},
					);
					const data = await res.json();
					if (data.approved) {
						return true;
					} else {
						console.warn(
							'[NextAuthProduction] Sign-in rejected by Pi backend',
							data,
						);
						return false;
					}
				} catch (err) {
					console.error(
						'[NextAuthProduction] Error proxying sign-in to Pi backend',
						err,
					);
					return false;
				}
			}
			// On Pi, do local DB check (already handled in /api/internal/auth/signin)
			return true;
		},
		async session({session, token, user}) {
			if (isVercel) {
				// Enrich session from Pi backend
				try {
					const res = await fetch(
						`${apiBaseUrl.prod}/api/internal/auth/session`,
						{
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								[header.internalApiSecret]: secret.internalApiSecret ?? '',
							},
							body: JSON.stringify({email: session.user?.email}),
						},
					);
					const data = await res.json();
					if (data && data.email) {
						session.user = {
							...session.user,
							...data,
						};
					}
				} catch (err) {
					console.error(
						'[NextAuthProduction] Error proxying session to Pi backend',
						err,
					);
				}
			}
			return session;
		},
		async jwt({token, user, account, profile}) {
			if (isVercel && token.email) {
				try {
					const res = await fetch(
						`${apiBaseUrl.prod}/api/internal/auth/session`,
						{
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								[header.internalApiSecret]: secret.internalApiSecret ?? '',
							},
							body: JSON.stringify({email: token.email}),
						},
					);
					const data = await res.json();
					if (data && data.email) {
						return {...token, ...data};
					}
				} catch (err) {
					console.error(
						'[NextAuthProduction] Error enriching JWT from Pi backend',
						err,
					);
				}
			}
			return token;
		},
	},
	cookies: isPi
		? {
				sessionToken: {
					name: `__Secure-next-auth.session-token`,
					options: {
						domain: process.env.NEXTAUTH_COOKIE_DOMAIN || '.jobscoutly.tech',
						path: '/',
						httpOnly: true,
						sameSite: 'lax',
						secure: true,
					},
				},
		  }
		: undefined,
};
