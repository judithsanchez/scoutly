import {NextAuthOptions} from 'next-auth';
import {productionAuthOptions} from './auth.production';
import {developmentAuthOptions} from './auth.development';
import {env, deployment} from '@/config';

function createAuthOptions(): NextAuthOptions {
	if (env.isDev) {
		console.log('🟢 Using development auth provider (auto-approve, dev only)');
		return developmentAuthOptions;
	}

	if (env.isProd && deployment.isVercel) {
		console.log('🔒 Using production auth provider (pre-approval required)');
		return productionAuthOptions;
	}

	console.warn(
		'⚠️ No matching environment found, defaulting to development auth provider',
	);
	return developmentAuthOptions;
}

export const authOptions: NextAuthOptions = createAuthOptions();
