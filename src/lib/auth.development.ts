import {NextAuthOptions} from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import {User} from '@/models/User';
import {AdminUser} from '@/models/AdminUser';
import dbConnect from '@/middleware/database';
import {auth} from '@/config';

export const developmentAuthOptions: NextAuthOptions = {
	providers: [
		GoogleProvider({
			clientId: auth.googleClientId!,
			clientSecret: auth.googleClientSecret!,
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

				let existingUser = await User.findOne({
					email: user.email.toLowerCase(),
				});

				if (!existingUser) {
					console.log(`Dev Auth: Auto-creating user ${user.email}`);

					existingUser = await User.create({
						email: user.email.toLowerCase(),
						candidateInfo: {
							name: user.name || profile?.name || 'Development User',
							email: user.email.toLowerCase(),
						},
						cvUrl: 'dev-mock-cv-url',
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

					const userData = await User.findOne({
						email: session.user.email.toLowerCase(),
					});

					const isAdmin = await AdminUser.findOne({
						email: session.user.email.toLowerCase(),
					});

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
					session.user = {
						email: session.user.email,
						isAdmin: false,
						hasCompleteProfile: true,
					};
				}
			}
			return session;
		},
		async jwt({token, user, account}) {
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
					token.isAdmin = false;
					token.hasCompleteProfile = true;
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
