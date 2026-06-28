<?php

namespace App\Observers;

use App\Models\Gta6Character;
use App\Services\CacheRevalidationService;
use Illuminate\Support\Facades\Cache;

class Gta6CharacterObserver
{
    public function saved(Gta6Character $character): void
    {
        $this->clearCache($character->slug);
        CacheRevalidationService::revalidatePaths([
            '/gta6/characters',
            '/gta6/characters/'.$character->slug,
            '/gta6',
        ]);
    }

    public function deleted(Gta6Character $character): void
    {
        $this->clearCache($character->slug);
        CacheRevalidationService::revalidatePaths(['/gta6/characters', '/gta6']);
    }

    private function clearCache(string $slug): void
    {
        Cache::forget("gta6.character.{$slug}");

        // Unfiltered list (most common case — new item not appearing)
        Cache::forget('gta6.characters.'.md5(serialize(['search' => null, 'role' => null])));

        // Role-filtered lists
        foreach (['protagonist', 'antagonist', 'supporting'] as $role) {
            Cache::forget('gta6.characters.'.md5(serialize(['search' => null, 'role' => $role])));
        }
    }
}
