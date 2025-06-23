import {withAuth} from 'next-auth/middleware';
import {NextResponse} from 'next/server';

export default withAuth(
	function middleware(req) {
		const token = req.nextauth.token;
		const pathname = req.nextUrl.pathname;

		// Admin routes - require admin access
		if (pathname.startsWith('/admin')) {
			if (!token?.isAdmin) {
				return NextResponse.redirect(
					new URL('/auth/signin?error=AccessDenied', req.url),
				);
			}
		}

		// Job scouting routes - require complete profile
		if (
			pathname.startsWith('/dashboard') ||
			pathname.startsWith('/companies') ||
			pathname.startsWith('/saved-jobs')
		) {
			if (!token?.hasCompleteProfile) {
				return NextResponse.redirect(
					new URL('/profile?required=true', req.url),
				);
			}
		}

		return NextResponse.next();
	},
	{
		callbacks: {
			authorized: ({token, req}) => {
				const pathname = req.nextUrl.pathname;

				// Skip auth for public routes
				if (
					pathname === '/' ||
					pathname.startsWith('/auth/') ||
					pathname.startsWith('/api/auth/') ||
					pathname.startsWith('/_next/') ||
					pathname.startsWith('/favicon.ico')
				) {
					return true;
				}

				// All other routes require authentication
				return !!token;
			},
		},
	},
);

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		'/((?!api|_next/static|_next/image|favicon.ico|public).*)',
	],
};
