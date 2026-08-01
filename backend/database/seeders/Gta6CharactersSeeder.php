<?php

namespace Database\Seeders;

use App\Models\Gta6Character;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class Gta6CharactersSeeder extends Seeder
{
    /**
     * Publicly confirmed GTA VI characters (from official trailers / Rockstar).
     * Descriptions are original editorial summaries — no third-party text copied.
     * Images intentionally left null; redakcija adds official Rockstar art via admin.
     */
    public function run(): void
    {
        $characters = [
            [
                'name' => 'Lucia Caminos',
                'role' => 'protagonist',
                'description' => 'One of two playable protagonists and the first female lead in the Grand Theft Auto series. Introduced fresh out of prison, Lucia is sharp, determined and ready to do whatever it takes to change her fortunes alongside Jason.',
                'sort_order' => 1,
            ],
            [
                'name' => 'Jason Duval',
                'role' => 'protagonist',
                'description' => 'The second playable protagonist, drawn into a life of crime in the Keys. Jason\'s partnership with Lucia drives the story — a modern Bonnie-and-Clyde tale set across Leonida.',
                'sort_order' => 2,
            ],
            [
                'name' => 'Cal Hampton',
                'role' => 'supporting',
                'description' => 'An associate seen in the second trailer, part of the criminal network surrounding Jason and Lucia.',
                'sort_order' => 10,
            ],
            [
                'name' => 'Boobie Ike',
                'role' => 'supporting',
                'description' => 'A businessman and fixture of the Vice City underworld revealed in promotional material for GTA VI.',
                'sort_order' => 11,
            ],
            [
                'name' => 'Dre\'Quan Priest',
                'role' => 'supporting',
                'description' => 'A rising figure tied to the music scene of Leonida, featured in GTA VI marketing.',
                'sort_order' => 12,
            ],
            [
                'name' => 'Brian Heder',
                'role' => 'supporting',
                'description' => 'A character connected to the rural, swampland side of Leonida shown in the trailers.',
                'sort_order' => 13,
            ],
            [
                'name' => 'Raul Bautista',
                'role' => 'supporting',
                'description' => 'A crew member referenced in GTA VI material, linked to higher-stakes scores.',
                'sort_order' => 14,
            ],
        ];

        $count = 0;
        foreach ($characters as $c) {
            Gta6Character::updateOrCreate(
                ['slug' => Str::slug($c['name'])],
                array_merge($c, [
                    'status' => 'confirmed',
                    'is_published' => true,
                ])
            );
            $count++;
        }

        $this->command->info("Seeded {$count} GTA VI characters.");
    }
}
