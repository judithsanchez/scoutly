import {MongoDBAdapter} from '@next-auth/mongodb-adapter';
import {NextAuthOptions} from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import clientPromise from '@/lib/mongodb';

export const authOptions: NextAuthOptions = {
	adapter: MongoDBAdapter(clientPromise),
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		}),
	],
	callbacks: {
		async signIn({user, account, profile}) {
			// Only store the email
			if (user.email) {
				return true;
			}
			return false;
		},
		async session({session, user}) {
			// Only include email in the session
			if (session.user) {
				session.user = {
					email: session.user.email,
				};
			}
			return session;
		},
	},
	pages: {
		signIn: '/auth/signin',
	},
};
