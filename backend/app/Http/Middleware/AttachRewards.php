<?php

namespace App\Http\Middleware;

use App\Services\RewardLedger;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Puts what the request earned into the response that answers it.
 *
 * One place, so every endpoint that awards anything gets this without being
 * edited — including the ones that will be written next year.
 *
 * Only on writes. A GET that happens to trip a daily-login award would
 * otherwise announce it in the middle of an unrelated page load, and reward
 * confetti with no action behind it reads as a bug.
 */
class AttachRewards
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! $response instanceof JsonResponse || $request->isMethod('GET')) {
            return $response;
        }

        $ledger = app(RewardLedger::class);

        if ($ledger->isEmpty()) {
            return $response;
        }

        $payload = $response->getData(true);

        // Only shapes we recognise. An endpoint returning a bare array — a
        // paginated resource collection, say — is not ours to reshape, and
        // silently turning a list into an object would break its reader.
        if (! is_array($payload) || array_is_list($payload)) {
            return $response;
        }

        $payload['rewards'] = $ledger->toArray();

        $response->setData($payload);

        return $response;
    }
}
