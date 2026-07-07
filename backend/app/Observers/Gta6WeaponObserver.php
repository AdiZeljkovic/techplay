<?php

namespace App\Observers;

use App\Models\Gta6Weapon;
use App\Services\CacheRevalidationService;
use Illuminate\Support\Facades\Cache;

class Gta6WeaponObserver
{
    // Filament weapon type options (must match Filament resource select options)
    private const TYPES = [
        'Pistol', 'SMG', 'Rifle', 'Shotgun', 'Sniper',
        'Heavy', 'Explosive', 'Melee', 'Thrown',
    ];

    public function saved(Gta6Weapon $weapon): void
    {
        $this->clearCache($weapon->slug);
        // Detail pages were removed — weapons are a showcase-only listing
        CacheRevalidationService::revalidatePaths(['/gta6/weapons']);
    }

    public function deleted(Gta6Weapon $weapon): void
    {
        $this->clearCache($weapon->slug);
        CacheRevalidationService::revalidatePaths(['/gta6/weapons']);
    }

    private function clearCache(string $slug): void
    {
        Cache::forget("gta6.weapon.{$slug}");
        Cache::forget('gta6.weapons.types');

        // Unfiltered list
        Cache::forget('gta6.weapons.'.md5(serialize(['search' => null, 'type' => null])));

        // Type-filtered lists
        foreach (self::TYPES as $type) {
            Cache::forget('gta6.weapons.'.md5(serialize(['search' => null, 'type' => $type])));
        }
    }
}
