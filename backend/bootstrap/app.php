<?php

use App\Http\Middleware\CheckUserBan;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\TrackUserActivity;
use App\Http\Middleware\VerifyDiscordBot;
use App\Support\TrustedProxies;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Trusting every proxy means trusting every client: with `at: '*'`,
        // `$request->ip()` is whatever the caller puts in X-Forwarded-For. That
        // silently defeated all three IP-based controls at once — the API rate
        // limiter, the giveaway per-network entry cap, and the article-view
        // fingerprint — because each one keys off an attacker-chosen value.
        //
        // Laravel walks the forwarded chain from the right and stops at the
        // first address that is not a trusted proxy, so a spoofed prefix is
        // discarded: Cloudflare and nginx append the true peer after it.
        //
        // Set TRUSTED_PROXIES=* to restore the old behaviour if the proxy
        // topology here turns out to differ.
        $middleware->trustProxies(at: TrustedProxies::at());

        // SECURITY: Exclude routes from CSRF verification
        // - PayPal webhook: verified by PayPal signature
        // - Contact form: public endpoint, protected by rate limiting (3/10min)
        // - Article view tracking: public endpoint, protected by fingerprint throttling (30min)
        $middleware->validateCsrfTokens(except: [
            'api/v1/webhooks/paypal',
            'api/v1/contact',
            'api/v1/newsletter/*',
            'api/v1/articles/*/view',
        ]);

        // SECURITY: Stateful API domains for Sanctum CSRF protection
        $middleware->statefulApi();

        // SECURITY: every API route gets the 'api' limiter. Without this call
        // Laravel builds the group with a null limiter, so only routes that
        // said `throttle:` explicitly were metered — which left password
        // changes, account deletion, orders, messages and the whole clan
        // surface completely unlimited.
        $middleware->throttleApi('api');

        // SECURITY: Add security headers to all responses
        $middleware->append(SecurityHeaders::class);

        // Track authenticated users as online (used for forum online counter)
        $middleware->appendToGroup('api', TrackUserActivity::class);
        $middleware->appendToGroup('api', CheckUserBan::class);

        $middleware->alias([
            'ban.check' => CheckUserBan::class,
            'discord.bot' => VerifyDiscordBot::class,
        ]);

        $middleware->redirectGuestsTo(function ($request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return null; // Don't redirect, let exception handler deal with it
            }

            return route('filament.admin.auth.login');
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (AuthenticationException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                ], 401);
            }
        });
    })->create();
