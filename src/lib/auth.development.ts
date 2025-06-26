import {NextAuthOptions} from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import {User} from '@/models/User';
import {AdminUser} from '@/models/AdminUser';
import dbConnect from '@/middleware/database';

/**
 * Development-only auth configuration
 *
 * This configuration is designed for development environments where:
 * - Any user can sign in
 * - Users are auto-created if they don't exist
 * - Mock data is provided for complete profiles
 * - No pre-approval checks are performed
 *
 * WARNING: This should NEVER be used in production
 */
export const developmentAuthOptions: NextAuthOptions = {
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		}),
	],
	callbacks: {
		async signIn({user, account, profile}) {
			try {
				await dbConnect();

				if (!user.email) {
					console.log('Dev Auth: No email provided, rejecting');
					return false;
				}

				// Check if user exists
				let existingUser = await User.findOne({
					email: user.email.toLowerCase(),
				});

				// Auto-create user if they don't exist
				if (!existingUser) {
					console.log(`Dev Auth: Auto-creating user ${user.email}`);

					existingUser = await User.create({
						email: user.email.toLowerCase(),
						candidateInfo: {
							name: user.name || profile?.name || 'Development User',
							email: user.email.toLowerCase(),
						},
						cvUrl: 'dev-mock-cv-url', // Mock CV URL for development
						preferences: {
							jobTypes: [],
							locations: [],
							salaryRange: {min: 0, max: 200000},
						},
					});
				}

				console.log(`Dev Auth: User ${user.email} signed in successfully`);
				return true;
			} catch (error) {
				console.error('Dev Auth: Error during sign-in:', error);
				return false;
			}
		},
		async session({session, user}) {
			if (session.user?.email) {
				try {
					await dbConnect();

					// Get user data
					const userData = await User.findOne({
						email: session.user.email.toLowerCase(),
					});

					// Check if user is admin
					const isAdmin = await AdminUser.findOne({
						email: session.user.email.toLowerCase(),
					});

					// In development, always consider profile complete if user has CV
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
					console.error('Dev Auth: Error enriching session:', error);
					// Provide fallback session for development
					session.user = {
						email: session.user.email,
						isAdmin: false,
						hasCompleteProfile: true, // Always true in dev for convenience
					};
				}
			}
			return session;
		},
		async jwt({token, user, account}) {
			// Persist admin status and profile completion in JWT
			if (user?.email) {
				try {
					await dbConnect();

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
					console.error('Dev Auth: Error enriching JWT:', error);
					// Provide fallback for development
					token.isAdmin = false;
					token.hasCompleteProfile = true; // Always true in dev
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
