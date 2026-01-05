<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AdCampaign;
use Illuminate\Http\Request;

class AdController extends Controller
{
    /**
     * Get active ad for a specific position
     */
    public function show($position)
    {
        $ad = AdCampaign::active()
            ->forPosition($position)
            ->orderBy('priority', 'desc')
            ->first();

        if (!$ad) {
            return response()->json(null);
        }

        // Increment view count
        $ad->increment('view_count');

        return response()->json([
            'id' => $ad->id,
            'type' => $ad->type,
            'image_url' => $ad->image_url ? asset('storage/' . $ad->image_url) : null,
            'code_block' => $ad->code_block,
            'target_url' => $ad->target_url,
            'position' => $ad->position,
        ]);
    }

    /**
     * Track a click on an ad
     */
    public function click($id)
    {
        $ad = AdCampaign::find($id);
        if ($ad) {
            $ad->increment('click_count');
        }
        return response()->json(['success' => true]);
    }
}
