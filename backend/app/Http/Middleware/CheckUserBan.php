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

        if ($user && $user->isCurrentlyBanned()) {
            $message = $user->is_banned
                ? 'Your account has been banned.'
                : 'You are temporarily restricted from posting until '.$user->banned_until->format('M j, Y H:i').'.';

            return response()->json(['message' => $message], 403);
        }

        return $next($request);
    }
}
