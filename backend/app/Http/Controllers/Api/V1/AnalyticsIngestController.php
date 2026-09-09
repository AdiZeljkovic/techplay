<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsCollector;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Where the site's own GA relay hands us a copy of each hit.
 *
 * Not called by browsers. `frontend/app/proxy/ga/[...path]/route.ts` already
 * receives every hit on our own hostname and forwards it to Google; it now
 * forwards it here too, server to server, after the reader has been answered.
 * Nothing about the page changes and the reader waits for nothing.
 *
 * Because the caller is our own frontend and not a browser, the real visitor's
 * address and user agent arrive as fields rather than as the connection's own
 * — the connection belongs to the frontend process. That is also why the
 * endpoint has to be authenticated: anything that can post here can invent
 * readers, and a number anybody can inflate is not a number.
 */
class AnalyticsIngestController extends Controller
{
    public function collect(Request $request, AnalyticsCollector $collector): JsonResponse
    {
        if (! $this->authorised($request)) {
            // 404 rather than 403: an endpoint that answers "wrong secret" has
            // told you it exists and that a secret is what is missing.
            return response()->json(['message' => 'Not found'], 404);
        }

        $data = $request->validate([
            'params' => ['required', 'array'],
            'ip' => ['required', 'string', 'max:60'],
            'ua' => ['present', 'string', 'max:1000'],
            'hints' => ['present', 'boolean'],
        ]);

        try {
            $collector->record(
                array_map(fn ($v) => is_scalar($v) ? (string) $v : '', $data['params']),
                $data['ip'],
                $data['ua'],
                $data['hints'],
            );
        } catch (\Throwable $e) {
            /*
             * A hit we could not store is not worth an error to the caller.
             *
             * The caller is a fire-and-forget task inside the relay; nothing
             * is waiting for this answer and nothing can retry it usefully.
             * Losing one page view silently is right — losing the reader's
             * page because our counter threw is not.
             */
            Log::channel('connections')->warning('analytics ingest failed', [
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * A shared secret, compared in constant time.
     *
     * `hash_equals` rather than `===` because the comparison happens on every
     * page view of the site, which is exactly the volume that makes a timing
     * difference measurable.
     */
    private function authorised(Request $request): bool
    {
        $expected = (string) config('services.analytics.ingest_token');

        if ($expected === '') {
            return false;
        }

        return hash_equals($expected, (string) $request->header('X-Analytics-Token'));
    }
}
