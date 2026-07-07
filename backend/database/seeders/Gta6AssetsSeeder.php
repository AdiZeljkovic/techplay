<?php

namespace Database\Seeders;

use App\Models\Gta6Vehicle;
use App\Models\Gta6Weapon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;

/**
 * Seeds GTA 6 vehicles & weapons from image filenames dropped into
 * frontend/public/gta6/{vehicles,weapons}. Data lives in data/gta6_assets.php.
 *
 * Idempotent — upserts by slug, never overwrites fields an editor may have
 * polished in Filament (name/class/type are only set on first insert).
 *
 * Runs withoutEvents: the Gta6 observers fire an HTTP revalidation per save,
 * which would mean 150+ webhook calls — caches are cleared once at the end.
 */
class Gta6AssetsSeeder extends Seeder
{
    public function run(): void
    {
        $data = require __DIR__.'/data/gta6_assets.php';

        Gta6Vehicle::withoutEvents(function () use ($data) {
            foreach ($data['vehicles'] as $entry) {
                $existing = Gta6Vehicle::where('slug', $entry['slug'])->first();

                if ($existing) {
                    $existing->update(['image' => $entry['image']]);

                    continue;
                }

                Gta6Vehicle::create([
                    'slug' => $entry['slug'],
                    'name' => $entry['name'],
                    'image' => $entry['image'],
                    'status' => 'confirmed',
                    'is_published' => true,
                    'sort_order' => 0,
                ]);
            }
        });

        Gta6Weapon::withoutEvents(function () use ($data) {
            foreach ($data['weapons'] as $entry) {
                $existing = Gta6Weapon::where('slug', $entry['slug'])->first();

                if ($existing) {
                    $existing->update(['image' => $entry['image']]);

                    continue;
                }

                Gta6Weapon::create([
                    'slug' => $entry['slug'],
                    'name' => $entry['name'],
                    'image' => $entry['image'],
                    'status' => 'confirmed',
                    'is_published' => true,
                    'sort_order' => 0,
                ]);
            }
        });

        // Bust the unfiltered list caches once (observers were skipped)
        Cache::forget('gta6.vehicles.'.md5(serialize(['search' => null, 'class' => null])));
        Cache::forget('gta6.vehicles.classes');
        Cache::forget('gta6.weapons.'.md5(serialize(['search' => null, 'type' => null])));
        Cache::forget('gta6.weapons.types');

        $this->command?->info(sprintf(
            'GTA6 assets seeded: %d vehicles, %d weapons.',
            count($data['vehicles']),
            count($data['weapons']),
        ));
    }
}
