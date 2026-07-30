<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Symfony\Component\HttpFoundation\Response;

class TrackUserActivity
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($user = $request->user()) {
            // Record user as online using a sorted set (score = unix timestamp for easy TTL pruning).
            // Best-effort: presence tracking must never fail the request (tests run without Redis).
            try {
                Redis::zadd('forum:users:online', now()->timestamp, $user->id);
            } catch (\Throwable) {
                // Redis unavailable — skip
            }
        }

        return $response;
    }
}
