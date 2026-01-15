import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
// Note: Only include routes that need TRUE server-side protection
// Most auth is handled client-side with Bearer tokens in localStorage
const protectedRoutes: string[] = [
    // '/support/checkout', // Handled client-side to depend on Bearer token, not cookies
    // '/settings', // Handled client-side via useAuth to avoid middleware cookie dependency
];

// Routes that should redirect to dashboard if already logged in
const authRoutes = [
    '/login',
    '/register',
];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check for auth token in cookies (Sanctum uses cookies)
    const authToken = request.cookies.get('laravel_session') ||
        request.cookies.get('XSRF-TOKEN');

    const isAuthenticated = !!authToken;

    // Check if accessing a protected route without auth
    const isProtectedRoute = protectedRoutes.some(route =>
        pathname.startsWith(route)
    );

    if (isProtectedRoute && !isAuthenticated) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Check if accessing auth routes while logged in
    const isAuthRoute = authRoutes.some(route =>
        pathname.startsWith(route)
    );

    if (isAuthRoute && isAuthenticated) {
        return NextResponse.redirect(new URL('/', request.url));
    }

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
