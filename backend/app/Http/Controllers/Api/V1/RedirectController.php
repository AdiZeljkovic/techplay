<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Redirect;
use Illuminate\Http\Request;

class RedirectController extends Controller
{
    /**
     * Get all active redirects.
     * efficient for caching in frontend middleware.
     */
    public function index()
    {
        // Return simple map or list
        // List is better for regex matching if we support that later.
        // For now, strict match is fine, so Map is easiest for O(1) in JS.
        // But let's return list to be flexible.

        $redirects = Redirect::where('is_active', true)
            ->get(['source_url', 'target_url', 'status_code']);

        return response()->json($redirects);
    }
}
