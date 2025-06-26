import {NextAuthOptions} from 'next-auth';
import {productionAuthOptions} from './auth.production';
import {developmentAuthOptions} from './auth.development';

/**
 * Factory function to select the appropriate auth configuration based on environment
 * Uses NEXT_PUBLIC_USE_DEV_AUTH to determine which auth provider to use
 */
function createAuthOptions(): NextAuthOptions {
	// Check multiple sources for the dev auth flag
	const useDevAuth = 
		process.env.NEXT_PUBLIC_USE_DEV_AUTH === 'true' ||
		process.env.USE_DEV_AUTH === 'true' ||
		process.env.NODE_ENV === 'development';

	console.log('🔍 Auth Factory Debug:', {
		NEXT_PUBLIC_USE_DEV_AUTH: process.env.NEXT_PUBLIC_USE_DEV_AUTH,
		USE_DEV_AUTH: process.env.USE_DEV_AUTH,
		NODE_ENV: process.env.NODE_ENV,
		useDevAuth,
	});

	if (useDevAuth) {
		console.log('🔧 Using development auth provider (auto-approve enabled)');
		return developmentAuthOptions;
	} else {
		console.log('🔒 Using production auth provider (pre-approval required)');
		return productionAuthOptions;
	}
}

export const authOptions: NextAuthOptions = createAuthOptions();
