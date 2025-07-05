import {NextAuthOptions} from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import {User} from '@/models/User';
import {AdminUser} from '@/models/AdminUser';
import connectToDB from '@/lib/db';

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
				await connectToDB();

				if (!user.email) {
					console.log('Sign-in rejected: No email provided');
					return false;
				}

				// Check if user exists in our User collection (pre-approved users only)
				const existingUser = await User.findOne({
					email: user.email.toLowerCase(),
				});

				if (!existingUser) {
					console.log(
						`Sign-in rejected: User ${user.email} is not pre-approved`,
					);
					return false;
				}

				console.log(`Sign-in approved: User ${user.email} found in database`);
				return true;
			} catch (error) {
				console.error('Error during sign-in check:', error);
				return false;
			}
		},
		async session({session, user}) {
			console.log('🔍 Session callback started:', {
				sessionUser: session.user?.email,
				user: user?.email,
			});

			if (session.user?.email) {
				try {
					await connectToDB();

					// Get user data
					const userData = await User.findOne({
						email: session.user.email.toLowerCase(),
					});

					// Check if user is admin
					const isAdmin = await AdminUser.findOne({
						email: session.user.email.toLowerCase(),
					});

					// Check if profile is complete
					const hasCompleteProfile = !!(
						userData?.cvUrl && userData?.candidateInfo
					);

					session.user = {
						...session.user,
						email: session.user.email,
						isAdmin: !!isAdmin,
						hasCompleteProfile,
						cvUrl: userData?.cvUrl,
					};
				} catch (error) {
					console.error('Error enriching session:', error);
					// Keep basic session if database error
					session.user = {
						email: session.user.email,
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
