<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckUserBan
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Runs on the whole API group, so a ban is an account sanction rather
        // than a forum-posting mute — it used to sit on six forum routes while
        // banned accounts kept entering giveaways and placing shop orders.
        // Reads stay open: a banned user should see why they are banned, not a
        // site that appears broken.
        if ($request->isMethodSafe()) {
            return $next($request);
        }

        if ($user && $user->isCurrentlyBanned()) {
            $message = $user->is_banned
                ? 'Your account has been banned.'
                : 'You are temporarily restricted from posting until '.$user->banned_until->format('M j, Y H:i').'.';

            return response()->json(['message' => $message], 403);
        }

        return $next($request);
    }
}
