import {NextAuthOptions} from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const developmentAuthOptions: NextAuthOptions = {
	providers: [
		CredentialsProvider({
			name: 'Dev Login',
			credentials: {
				email: {label: 'Email', type: 'email'},
			},
			async authorize(credentials) {
				const allowedEmail =
					process.env.BOOTSTRAP_ADMIN_EMAIL || 'judithv.sanchezc@gmail.com';
				if (credentials?.email === allowedEmail) {
					return {id: '1', email: credentials.email, name: 'Dev Admin'};
				}
				return null;
			},
		}),
	],
	session: {strategy: 'jwt'},
};
