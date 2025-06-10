import {withAuth} from 'next-auth/middleware';

export default withAuth({
	callbacks: {
		authorized({req, token}) {
			const isAuth = !!token;
			const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
			const isProtectedRoute =
				req.nextUrl.pathname.startsWith('/dashboard') ||
				req.nextUrl.pathname.startsWith('/companies') ||
				req.nextUrl.pathname.startsWith('/saved-jobs');

			if (isAuthPage) {
				// Redirect logged-in users away from auth pages
				return !isAuth;
			} else if (isProtectedRoute) {
				// Only allow logged-in users on protected routes
				return isAuth;
			}

			// Allow public access to all other routes
			return true;
		},
	},
	pages: {
		signIn: '/auth/signin',
	},
});

export const config = {
	matcher: [
		'/dashboard/:path*',
		'/companies/:path*',
		'/saved-jobs/:path*',
		'/auth/:path*',
	],
};
