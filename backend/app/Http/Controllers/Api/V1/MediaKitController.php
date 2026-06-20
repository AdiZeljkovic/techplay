<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\MediaKitSetting;
use App\Services\MediaKitService;
use Illuminate\Support\Facades\Cache;

class MediaKitController extends Controller
{
    public function __construct(
        protected MediaKitService $mediaKitService
    ) {}

    /**
     * Get complete media kit data
     */
    public function index()
    {
        $data = Cache::remember('media_kit.full', 3600, function () {
            return [
                'about' => MediaKitSetting::where('section', 'about')
                    ->where('is_visible', true)
                    ->orderBy('order')
                    ->get()
                    ->mapWithKeys(fn ($s) => [$s->key => $s->typed_value]),

                'statistics' => $this->mediaKitService->getStatistics(),

                'social' => MediaKitSetting::where('section', 'social')
                    ->where('is_visible', true)
                    ->orderBy('order')
                    ->get()
                    ->mapWithKeys(fn ($s) => [$s->key => $s->typed_value]),

                'audience' => MediaKitSetting::where('section', 'audience')
                    ->where('is_visible', true)
                    ->orderBy('order')
                    ->get()
                    ->mapWithKeys(fn ($s) => [$s->key => $s->typed_value]),

                'content' => MediaKitSetting::where('section', 'content')
                    ->where('is_visible', true)
                    ->orderBy('order')
                    ->get()
                    ->mapWithKeys(fn ($s) => [$s->key => $s->typed_value]),

                'development' => MediaKitSetting::where('section', 'development')
                    ->where('is_visible', true)
                    ->orderBy('order')
                    ->get()
                    ->mapWithKeys(fn ($s) => [$s->key => $s->typed_value]),
            ];
        });

        return response()->json($data)
            ->header('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    }
}
