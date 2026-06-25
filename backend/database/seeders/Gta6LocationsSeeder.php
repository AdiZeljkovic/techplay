<?php

namespace Database\Seeders;

use App\Models\GtaLocation;
use Illuminate\Database\Seeder;

class Gta6LocationsSeeder extends Seeder
{
    // Meta-tags that are status/source indicators, not actual categories
    private const META_TAGS = ['2022', 'unconfirmed', 'may-not-exist', 'reused', 'address-ambiguous'];

    public function run(): void
    {
        $path = database_path('data/gta6_landmarks.json');

        if (! file_exists($path)) {
            $this->command->error("File not found: {$path}");
            return;
        }

        $data = json_decode(file_get_contents($path), true);

        if (! $data) {
            $this->command->error('Failed to parse gta6_landmarks.json');
            return;
        }

        $imported = 0;

        foreach ($data as $key => $loc) {
            // Skip entries without GPS coordinates (can't place on map)
            $lat = $loc[4][0] ?? null;
            $lng = $loc[4][1] ?? null;

            if ($lat === null || $lng === null) {
                continue;
            }

            $categories   = $loc[6] ?? [];
            $isUnconfirmed = in_array('unconfirmed', $categories) || in_array('may-not-exist', $categories);

            GtaLocation::updateOrCreate(
                ['gtadb_key' => $key],
                [
                    'name'          => $loc[0],
                    'game_x'        => $loc[1][0] ?? null,
                    'game_y'        => $loc[1][1] ?? null,
                    'real_address'  => $loc[3] ?? null,
                    'lat'           => $lat,
                    'lng'           => $lng,
                    'categories'    => $categories,
                    'is_unconfirmed' => $isUnconfirmed,
                ]
            );

            $imported++;
        }

        $this->command->info("Imported {$imported} GTA VI locations (out of " . count($data) . " total).");
    }
}
