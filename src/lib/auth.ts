import {NextAuthOptions} from 'next-auth';
import {productionAuthOptions} from './auth.production';

/**
 * Factory function to select the appropriate auth configuration based on environment
 * Currently, it only supports the production auth provider
 */
function createAuthOptions(): NextAuthOptions {
	console.log('🔒 Using production auth provider (pre-approval required)');
	return productionAuthOptions;
}

export const authOptions: NextAuthOptions = createAuthOptions();
