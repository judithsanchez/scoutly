/** @type {import('next').NextConfig} */
const nextConfig = {
	webpack: (config, {isServer}) => {
		if (!isServer) {
			// Don't bundle server-only modules on the client side
			config.resolve.fallback = {
				...config.resolve.fallback,
				net: false,
				dns: false,
				tls: false,
				fs: false,
				child_process: false,
			};
		}

		// Handle undici module parsing issues
		config.module.rules.push({
			test: /\.m?js$/,
			type: 'javascript/auto',
			resolve: {
				fullySpecified: false,
			},
		});

		return config;
	},
	experimental: {
		serverComponentsExternalPackages: ['playwright', 'playwright-core'],
		esmExternals: 'loose',
	},
	async headers() {
		// Determine CORS origin based on environment
		const isProd = process.env.NODE_ENV === 'production';
		const isDev = process.env.NODE_ENV === 'development';

		let allowedOrigin;
		if (isDev) {
			// In development, allow localhost
			allowedOrigin = 'http://localhost:3000';
		} else {
			// In production, allow the specific production domain
			allowedOrigin = 'https://www.jobscoutly.tech';
		}

		return [
			{
				// Apply these headers to all routes
				source: '/api/:path*',
			   headers: [
				   {key: 'Access-Control-Allow-Credentials', value: 'true'},
				   {
					   key: 'Access-Control-Allow-Origin',
					   value: allowedOrigin,
				   },
				   {
					   key: 'Access-Control-Allow-Methods',
					   value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS',
				   },
				   {
					   key: 'Access-Control-Allow-Headers',
					   value:
						   'Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, Authorization, X-Internal-API-Secret',
				   },
				   // Debug log header for CORS troubleshooting
				   {
					   key: 'X-CORS-Debug',
					   value: 'CORS headers set by next.config.mjs',
				   },
			   ],
			},
		];
	},
};

export default nextConfig;
