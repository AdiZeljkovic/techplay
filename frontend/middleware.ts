import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require server-side authentication check
// Note: Most routes use client-side Bearer token auth from localStorage
// Only add routes here that absolutely need server-side protection
const protectedRoutes: string[] = [
    // Currently empty - all auth handled client-side
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Note: Authentication is handled client-side with Bearer tokens in localStorage
    // Middleware cannot access localStorage, so we only handle server-side protected routes here
    // IMPORTANT: Do NOT use XSRF-TOKEN cookie for auth checks - it's a CSRF token, not auth!

    // -------------------------------------------------------------------------
    // MAINTENANCE MODE CHECK
    // -------------------------------------------------------------------------

    // Skip maintenance check for assets, api, and _next
    if (
        !pathname.startsWith('/api') &&
        !pathname.startsWith('/_next') &&
        !pathname.includes('.') // Files (images, etc)
    ) {
        // Check for bypass cookie
        const hasBypassCookie = request.cookies.get('techplay_maintenance_bypass');
        const isMaintenancePage = pathname === '/coming-soon';

        if (!hasBypassCookie) {
            try {
                // Fetch status from API (backend)
                let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

                // Sanitize URL: remove trailing slash
                apiUrl = apiUrl.replace(/\/$/, '');
                // Sanitize URL: remove /api/v1 suffix if present to avoid duplication
                if (apiUrl.endsWith('/api/v1')) {
                    apiUrl = apiUrl.substring(0, apiUrl.length - 7);
                }

                // Now apiUrl is clean base domain (e.g. http://localhost:8000)
                const res = await fetch(`${apiUrl}/api/v1/system/status`, {
                    // Fail fast if backend is slow
                    signal: AbortSignal.timeout(2000),
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (res.ok) {
                    const data = await res.json();

                    // IF MAINTENANCE IS ON
                    if (data.maintenance_mode === true) {
                        // If not already on coming soon page, redirect
                        if (!isMaintenancePage) {
                            return NextResponse.redirect(new URL('/coming-soon', request.url));
                        }
                        // Allow access to coming soon page
                        return NextResponse.next();
                    }

                    // IF MAINTENANCE IS OFF
                    else {
                        // If user tries to access coming soon page when maintenance is off, redirect home
                        if (isMaintenancePage) {
                            return NextResponse.redirect(new URL('/', request.url));
                        }
                    }
                }
            } catch (error) {
                // If API is down or unreachable, fail open (allow access) 
                // OR fail closed (redirect to coming soon). 
                // Choosing fail open to prevent blocking site if API hiccups.
                console.error('Maintenance check failed:', error);
            }
        } else {
            // User has bypass cookie - allow everything
            // But if they go to /coming-soon manually, redirect them home because they are techinically "staff"
            if (isMaintenancePage) {
                return NextResponse.redirect(new URL('/', request.url));
            }
        }
    }

    // -------------------------------------------------------------------------
    // AUTH CHECK (Existing Logic)
    // -------------------------------------------------------------------------

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
