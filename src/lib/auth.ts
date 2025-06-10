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
		async session({session, user}) {
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
