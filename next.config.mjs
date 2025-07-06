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
		return [
			{
				// Apply these headers to all routes
				source: '/api/:path*',
				headers: [
					{key: 'Access-Control-Allow-Credentials', value: 'true'},
					{
						key: 'Access-Control-Allow-Origin',
						value: 'https://www.jobscoutly.tech',
					},
					{
						key: 'Access-Control-Allow-Methods',
						value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS',
					},
					{
						key: 'Access-Control-Allow-Headers',
						value:
							'Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date',
					},
				],
			},
		];
	},
};

export default nextConfig;
