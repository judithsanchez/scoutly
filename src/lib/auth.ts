import {NextAuthOptions} from 'next-auth';
import {productionAuthOptions} from './auth.production';
import {developmentAuthOptions} from './auth.development';

/**
 * Factory function to select the appropriate auth configuration based on environment
 * Uses NEXT_PUBLIC_USE_DEV_AUTH to toggle between development and production providers
 */
function createAuthOptions(): NextAuthOptions {
	const useDevAuth = process.env.NEXT_PUBLIC_USE_DEV_AUTH === 'true';
	if (useDevAuth) {
		console.log('🟢 Using development auth provider (auto-approve, dev only)');
		return developmentAuthOptions;
	} else {
		console.log('🔒 Using production auth provider (pre-approval required)');
		return productionAuthOptions;
	}
}

export const authOptions: NextAuthOptions = createAuthOptions();
