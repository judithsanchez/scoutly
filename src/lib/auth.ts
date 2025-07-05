import {NextAuthOptions} from 'next-auth';

const useDevAuth = process.env.USE_DEV_AUTH === 'true';

let selectedOptions: NextAuthOptions;

if (useDevAuth) {
	selectedOptions = require('./auth.development').developmentAuthOptions;
	console.log(' Using development auth provider (dev bypass enabled)');
} else {
	selectedOptions = require('./auth.production').productionAuthOptions;
	console.log('🔒 Using production auth provider (pre-approval required)');
}

export const authOptions: NextAuthOptions = selectedOptions;
