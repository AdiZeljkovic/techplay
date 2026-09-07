<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Security Headers Middleware
 *
 * SECURITY: Adds security headers to all responses
 * Protects against XSS, clickjacking, MIME sniffing, etc.
 */
class SecurityHeaders
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // SECURITY: Prevent MIME type sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // SECURITY: Prevent clickjacking attacks
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // SECURITY: Enable browser XSS protection
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // SECURITY: Referrer policy (privacy)
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // SECURITY: Permissions policy (disable unnecessary browser features)
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

        /*
         * A policy for JSON, which is almost every response this host sends.
         *
         * There was no CSP here at all — commented out years ago with a note
         * that it "can break functionality", which is true of a policy written
         * for HTML and applied to Filament: the admin panel is Livewire and
         * Alpine, both of which live on inline script. So the admin keeps the
         * headers above and no CSP, and that stays a known gap.
         *
         * A JSON response is a different question and an easy one. It loads
         * nothing — no script, no style, no image, no frame — so the strictest
         * policy there is is also the one that cannot break it. `default-src
         * 'none'` says exactly that, and `frame-ancestors 'none'` says a JSON
         * body has no business inside anybody's iframe.
         *
         * It matters because a browser will happily render a JSON response it
         * was tricked into treating as a document. This closes that off for
         * the whole API without touching the one part of the host that renders
         * pages.
         */
        if ($response->headers->get('Content-Type') && str_contains((string) $response->headers->get('Content-Type'), 'json')) {
            $response->headers->set(
                'Content-Security-Policy',
                "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
            );
        }

        // SECURITY: HSTS (Force HTTPS) - only in production
        if (app()->environment('production')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
