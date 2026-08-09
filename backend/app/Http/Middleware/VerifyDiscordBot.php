<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * The shared secret that stands between the Discord bot and the API.
 *
 * This check used to be copy-pasted into each Discord controller, and the
 * copies drifted: /discord/presence and /discord/user never got one, so anyone
 * could write another member's "currently playing" status or map Discord IDs
 * onto TechPlay accounts. The bot was sending a secret all along — under a
 * different header name than the backend read.
 *
 * Applied to the whole route group, a new endpoint is authenticated by
 * default instead of only when someone remembers to add the check.
 */
class VerifyDiscordBot
{
    public function handle(Request $request, Closure $next): Response
    {
        $secret = config('services.discord.bot_secret');

        // Both spellings are accepted because the bot shipped with the second
        // one. Fails closed when the secret is unset — an unconfigured server
        // must not be an open one.
        $presented = (string) ($request->header('X-Discord-Bot-Token')
            ?? $request->header('X-Bot-Secret')
            ?? '');

        if (! $secret || ! hash_equals($secret, $presented)) {
            Log::warning('Discord API: unauthorized request', [
                'ip' => $request->ip(),
                'path' => $request->path(),
            ]);

            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return $next($request);
    }
}
