import {NextAuthOptions} from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import {auth} from '@/config';
import {Logger} from '@/utils/logger';

const logger = new Logger('NextAuthDevelopment');

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
				if (!user.email) {
					await logger.warn('Dev Auth: No email provided, rejecting');
					return false;
				}
				// Use AuthService to auto-create user if not exists
				const {AuthService} = await import('@/services/authService');
				await AuthService.createUserIfNotExists(user.email, {
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
				await logger.info(
					`Dev Auth: User ${user.email} signed in successfully`,
				);
				return true;
			} catch (error) {
				await logger.error('Dev Auth: Error during sign-in:', error);
				return false;
			}
		},
		async session({session, user}) {
			if (session.user?.email) {
				try {
					const {AuthService} = await import('@/services/authService');
					const userData = await AuthService.findUserByEmail(
						session.user.email,
					);
					const isAdmin = userData
						? await AuthService.isAdmin(session.user.email)
						: false;
					const hasCompleteProfile = userData
						? await AuthService.hasCompleteProfile(userData)
						: false;
					session.user = {
						...session.user,
						email: session.user.email,
						isAdmin: !!isAdmin,
						hasCompleteProfile,
						cvUrl: userData?.cvUrl,
					};
					await logger.debug('Session enriched', {
						email: session.user.email,
						isAdmin,
						hasCompleteProfile,
						cvUrl: userData?.cvUrl,
					});
				} catch (error) {
					await logger.error('Dev Auth: Error enriching session:', error);
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
					const {AuthService} = await import('@/services/authService');
					const userData = await AuthService.findUserByEmail(user.email);
					const isAdmin = userData
						? await AuthService.isAdmin(user.email)
						: false;
					const hasCompleteProfile = userData
						? await AuthService.hasCompleteProfile(userData)
						: true;
					token.isAdmin = !!isAdmin;
					token.hasCompleteProfile = hasCompleteProfile;
					token.cvUrl = userData?.cvUrl;
					await logger.debug('JWT enriched', {
						email: user.email,
						isAdmin,
						hasCompleteProfile,
						cvUrl: userData?.cvUrl,
					});
				} catch (error) {
					await logger.error('Dev Auth: Error enriching JWT:', error);
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
