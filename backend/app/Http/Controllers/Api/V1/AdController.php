<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AdCampaign;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;

class AdController extends Controller
{
    /**
     * Get active ad for a specific position
     */
    public function show(Request $request, $position)
    {
        // Detect device from User-Agent
        $userAgent = $request->header('User-Agent', '');
        $isMobile = preg_match('/Mobile|Android|iPhone|iPad|iPod/i', $userAgent);
        $device = $isMobile ? 'mobile_only' : 'desktop_only';

        // Detect platform
        $platform = 'desktop';
        if (preg_match('/Android/i', $userAgent)) {
            $platform = 'android_app';
        } elseif (preg_match('/iPhone|iPad|iPod/i', $userAgent)) {
            $platform = 'ios_app';
        } elseif ($isMobile) {
            $platform = 'mobile_web';
        }

        $ad = AdCampaign::active()
            ->forPosition($position)
            ->forDevice($device)
            ->forPlatform($platform)
            ->orderBy('priority', 'desc')
            ->first();

        if (! $ad) {
            return response()->json(null);
        }

        // One impression per viewer per ad per half hour. These counters are
        // what advertisers are billed on, and they used to increment on every
        // unauthenticated request with no deduplication whatsoever.
        if ($this->firstTouch('imp', $ad->id, $request)) {
            // PERFORMANCE: Use Redis atomic increment instead of sync DB write
            Redis::incr("views:ad:{$ad->id}");
        }

        return response()->json([
            'id' => $ad->id,
            'type' => $ad->type,
            'format' => $ad->format,
            'width' => $ad->width,
            'height' => $ad->height,
            'image_url' => $ad->image_url ? asset('storage/'.$ad->image_url) : null,
            'code_block' => $ad->code_block,
            'target_url' => $ad->target_url,
            'position' => $ad->position,
        ]);
    }

    /**
     * Track a click on an ad
     */
    public function click($id, Request $request)
    {
        // Active only: click() used to accept any id, including campaigns that
        // had already ended.
        $ad = AdCampaign::active()->find($id);

        if ($ad && $this->firstTouch('clk', $ad->id, $request)) {
            // PERFORMANCE: Use Redis atomic increment instead of sync DB write
            Redis::incr("clicks:ad:{$ad->id}");
        }

        return response()->json(['success' => true]);
    }

    /**
     * Has this viewer already been counted for this ad recently?
     *
     * Deliberately cheap and approximate — the goal is to stop a loop from
     * billing an advertiser thousands of times, not to identify anyone. Note
     * this rests on $request->ip() being truthful, which is only the case now
     * that trusted proxies are an explicit list rather than '*'.
     */
    private function firstTouch(string $kind, int $adId, Request $request): bool
    {
        $fingerprint = sha1($request->ip().'|'.substr((string) $request->userAgent(), 0, 80));
        $key = "ad:{$kind}:{$adId}:{$fingerprint}";

        try {
            // SET NX EX — true only for the first caller inside the window.
            return (bool) Redis::set($key, 1, 'EX', 1800, 'NX');
        } catch (\Throwable) {
            // Redis down: count it rather than lose the metric entirely.
            return true;
        }
    }
}
