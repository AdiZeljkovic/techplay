<?php

namespace App\Services\Releases;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

/**
 * The one way this package makes an outbound request.
 *
 * Every store gets the same browser user agent, the same timeout and the same
 * IPv4 pin — PHP's cURL on some hosts resolves IPv6 first and then waits out
 * the whole timeout for nothing.
 *
 * Certificate verification is skipped on local machines only, matching what
 * RawgService already does, because a Windows PHP without a CA bundle cannot
 * otherwise reach any of these stores and none of this would be testable by
 * hand. Deployed environments verify normally.
 */
trait TalksToStores
{
    protected function http(?int $timeout = null): PendingRequest
    {
        $request = Http::timeout($timeout ?? (int) config('releases.timeout'))
            ->connectTimeout(10)
            ->withOptions(['force_ip_resolve' => 'v4'])
            ->withHeaders(['User-Agent' => 'Mozilla/5.0']);

        return app()->environment('local') ? $request->withoutVerifying() : $request;
    }
}
