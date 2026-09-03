<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'broadcasting/auth'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    // array_filter, because the help origin below is null when no help
    // hostname is configured — and a null in this list is an entry every
    // origin check has to walk past.
    'allowed_origins' => array_values(array_filter(array_unique(array_merge(
        explode(',', env('FRONTEND_URL', 'http://localhost:3000')),
        [
            'https://techplay.gg',
            'https://www.techplay.gg',
            'https://beta.techplay.gg',
            /*
             * The help centre is a second origin, and the browser treats it as
             * a stranger.
             *
             * Every read on help.techplay.gg happens on the server, so nothing
             * there needed this until the "was this answer any use" button —
             * which is a POST from the reader's own browser to api-beta, and
             * therefore preflighted. Without it the preflight is refused and
             * the button fails with nothing anywhere to explain it: no error
             * the page can show, and no line in the API log, because the
             * request never arrives.
             *
             * An **origin**, not a URL. HELP_URL can carry a path — with it
             * unset, `config('app.help_url')` falls back to
             * `http://localhost:3000/help`, which is right for local
             * development, where there is no subdomain and /help answers off
             * the main frontend. As a CORS origin a path never matches
             * anything, so the scheme and host are taken and the rest dropped.
             *
             * FRONTEND_URL above cannot cover this. That variable is read raw
             * by the revalidation service as a single origin, so widening it
             * to a list would break publishing in order to fix a thumbs-up.
             */
            (static function (): ?string {
                $parts = parse_url((string) env('HELP_URL', ''));

                if (empty($parts['scheme']) || empty($parts['host'])) {
                    // No subdomain configured — local development, where the
                    // frontend's own origin is already on this list.
                    return null;
                }

                return $parts['scheme'].'://'.$parts['host']
                    .(isset($parts['port']) ? ':'.$parts['port'] : '');
            })(),
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3002',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
        ],
    )))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Requested-With',
        'X-CSRF-TOKEN',
        'X-XSRF-TOKEN', // Sanctum stateful API CSRF token
        'X-Socket-Id', // For Laravel Echo/Reverb
    ],

    'exposed_headers' => [],

    'max_age' => 86400, // Cache preflight for 24 hours (production optimization)

    'supports_credentials' => true,

];
