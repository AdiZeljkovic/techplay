<?php

namespace App\Observers;

use App\Models\Gta6Vehicle;
use App\Services\CacheRevalidationService;
use Illuminate\Support\Facades\Cache;

class Gta6VehicleObserver
{
    // Filament vehicle class options (must match Filament resource select options)
    private const CLASSES = [
        'Super', 'Sports', 'Sedan', 'Coupe', 'SUV', 'Muscle',
        'Off-Road', 'Motorcycle', 'Boat', 'Aircraft', 'Helicopter',
        'Commercial', 'Emergency', 'Utility',
    ];

    public function saved(Gta6Vehicle $vehicle): void
    {
        $this->clearCache($vehicle->slug);
        CacheRevalidationService::revalidatePaths([
            '/gta6/vehicles',
            '/gta6/vehicles/'.$vehicle->slug,
        ]);
    }

    public function deleted(Gta6Vehicle $vehicle): void
    {
        $this->clearCache($vehicle->slug);
        CacheRevalidationService::revalidatePaths(['/gta6/vehicles']);
    }

    private function clearCache(string $slug): void
    {
        Cache::forget("gta6.vehicle.{$slug}");
        Cache::forget('gta6.vehicles.classes');

        // Unfiltered list
        Cache::forget('gta6.vehicles.'.md5(serialize(['search' => null, 'class' => null])));

        // Class-filtered lists
        foreach (self::CLASSES as $class) {
            Cache::forget('gta6.vehicles.'.md5(serialize(['search' => null, 'class' => $class])));
        }
    }
}
