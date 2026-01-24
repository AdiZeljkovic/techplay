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

        // SECURITY: Content Security Policy (adjust as needed)
        // Note: Disabled by default as it can break functionality if not configured properly
        // $response->headers->set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");

        // SECURITY: HSTS (Force HTTPS) - only in production
        if (app()->environment('production')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
