<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = SiteSetting::all()->pluck('value', 'key');
        return response()->json($settings);
    }

    public function grouped()
    {
        $settings = SiteSetting::all()->groupBy('group')->map(function ($group) {
            return $group->pluck('value', 'key');
        });
        return response()->json($settings);
    }
}
