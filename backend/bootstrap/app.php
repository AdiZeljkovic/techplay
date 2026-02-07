<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');

        // SECURITY: Exclude routes from CSRF verification
        // - PayPal webhook: verified by PayPal signature
        // - Contact form: public endpoint, protected by rate limiting (3/10min)
        $middleware->validateCsrfTokens(except: [
            'api/v1/webhooks/paypal',
            'api/v1/contact',
        ]);

        // SECURITY: Stateful API domains for Sanctum CSRF protection
        $middleware->statefulApi();

        // SECURITY: Add security headers to all responses
        $middleware->append(\App\Http\Middleware\SecurityHeaders::class);

        $middleware->redirectGuestsTo(function ($request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return null; // Don't redirect, let exception handler deal with it
            }
            return route('filament.admin.auth.login');
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                ], 401);
            }
        });
    })->create();
