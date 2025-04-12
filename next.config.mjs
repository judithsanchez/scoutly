/** @type {import('next').NextConfig} */
const nextConfig = {
	async headers() {
		return [
			{
				// Apply these headers to all routes
				source: '/api/:path*',
				headers: [
					{key: 'Access-Control-Allow-Credentials', value: 'true'},
					{key: 'Access-Control-Allow-Origin', value: '*'},
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
