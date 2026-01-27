<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;

class SystemController extends Controller
{
    /**
     * Get system status and public settings.
     */
    public function status()
    {
        // Get maintenance mode setting
        $maintenance = SiteSetting::where('key', 'maintenance_mode')
            ->where('group', 'general') // Assuming it's in general group
            ->first();

        $isMaintenance = $maintenance && ($maintenance->value === '1' || $maintenance->value === 'true');

        return response()->json([
            'maintenance_mode' => $isMaintenance,
            'version' => '1.0.0',
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
