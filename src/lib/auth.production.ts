import {NextAuthOptions} from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import {User} from '@/models/User';
import {AdminUser} from '@/models/AdminUser';
import connectToDB from '@/lib/db';

// The apiClient is not used here because this is server-side code.
// We use fetch directly to communicate with the internal API on the Raspberry Pi.

/**
 * Production auth configuration
 *
 * This configuration enforces strict security:
 * - Only pre-approved users can sign in
 * - Users must exist in the database before authentication
 * - No automatic user creation
 * - Strict profile completion checks
 */
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
		async session({session, user}) {
			console.log('🔍 Session callback started:', {
				sessionUser: session.user?.email,
			});

			if (session.user?.email) {
				try {
					const internalApiUrl = process.env.NEXT_PUBLIC_API_URL;
					if (!internalApiUrl) {
						console.error('Internal API URL is not configured.');
						throw new Error('Internal API URL not set');
					}

					const response = await fetch(
						`${internalApiUrl}/api/internal/auth/session?email=${encodeURIComponent(
							session.user.email,
						)}`,
						{
							headers: {
								'X-Internal-API-Secret': process.env.INTERNAL_API_SECRET || '',
							},
						},
					);

					if (!response.ok) {
						throw new Error(
							`Internal session API failed with status ${response.status}`,
						);
					}

					const sessionData = await response.json();

					session.user = {
						...session.user,
						...sessionData,
					};
				} catch (error) {
					console.error('Error enriching session from internal API:', error);
					// Keep basic session if database error
					session.user = {
						...session.user,
						isAdmin: false,
						hasCompleteProfile: false,
					};
				}
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
			if (user?.email) {
				try {
					await connectToDB();

					const userData = await User.findOne({
						email: user.email.toLowerCase(),
					});

					const isAdmin = await AdminUser.findOne({
						email: user.email.toLowerCase(),
					});

					const hasCompleteProfile = !!(
						userData?.cvUrl && userData?.candidateInfo
					);

					token.isAdmin = !!isAdmin;
					token.hasCompleteProfile = hasCompleteProfile;
					token.cvUrl = userData?.cvUrl;
				} catch (error) {
					console.error('Error enriching JWT:', error);
					token.isAdmin = false;
					token.hasCompleteProfile = false;
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
};
