import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require server-side authentication check
// Note: Most routes use client-side Bearer token auth from localStorage
// Only add routes here that absolutely need server-side protection
const protectedRoutes: string[] = [
    // Currently empty - all auth handled client-side
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Note: Authentication is handled client-side with Bearer tokens in localStorage
    // Middleware cannot access localStorage, so we only handle server-side protected routes here
    // IMPORTANT: Do NOT use XSRF-TOKEN cookie for auth checks - it's a CSRF token, not auth!

    // Check if accessing a protected route
    const isProtectedRoute = protectedRoutes.some(route =>
        pathname.startsWith(route)
    );

    if (isProtectedRoute) {
        // For truly protected routes, check for session cookie
        // Note: Most auth is handled client-side, this is just a fallback
        const sessionCookie = request.cookies.get('laravel_session');
        if (!sessionCookie) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Auth route redirects (login/register when already logged in) are handled client-side
    // because we use Bearer tokens in localStorage which middleware cannot access

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
    ],
};
