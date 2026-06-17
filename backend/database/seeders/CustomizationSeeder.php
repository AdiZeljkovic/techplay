<?php

namespace Database\Seeders;

use App\Models\Customization;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CustomizationSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            // Themes (accent color overrides)
            ['name' => 'Ember Orange', 'type' => 'theme', 'cost' => 0, 'value' => '#FC4100', 'description' => 'The classic TechPlay accent.', 'sort_order' => 1],
            ['name' => 'Neon Cyan', 'type' => 'theme', 'cost' => 500, 'value' => '#22d3ee', 'description' => 'Cool cyberpunk cyan accent.', 'sort_order' => 2],
            ['name' => 'Toxic Green', 'type' => 'theme', 'cost' => 500, 'value' => '#22c55e', 'description' => 'High-voltage green accent.', 'sort_order' => 3],
            ['name' => 'Royal Violet', 'type' => 'theme', 'cost' => 750, 'value' => '#a855f7', 'description' => 'Regal violet accent.', 'sort_order' => 4],
            ['name' => 'Gold Prestige', 'type' => 'theme', 'cost' => 0, 'required_tier' => 'Gold', 'value' => '#FFD700', 'description' => 'Exclusive gold accent for Gold supporters.', 'sort_order' => 5],

            // Frames (avatar ring)
            ['name' => 'Bronze Ring', 'type' => 'frame', 'cost' => 250, 'value' => '#CD7F32', 'description' => 'A solid bronze ring.', 'sort_order' => 1],
            ['name' => 'Aurora Ring', 'type' => 'frame', 'cost' => 600, 'value' => 'linear-gradient(135deg,#22d3ee,#a855f7,#FC4100)', 'description' => 'A shifting aurora gradient ring.', 'sort_order' => 2],
            ['name' => 'Emerald Ring', 'type' => 'frame', 'cost' => 600, 'value' => 'linear-gradient(135deg,#22c55e,#0ea5e9)', 'description' => 'Emerald-to-sky gradient ring.', 'sort_order' => 3],
            ['name' => 'Diamond Ring', 'type' => 'frame', 'cost' => 0, 'required_tier' => 'Platinum', 'value' => 'linear-gradient(135deg,#67e8f9,#ffffff,#60a5fa)', 'description' => 'Exclusive shimmering frame for Platinum supporters.', 'sort_order' => 4],

            // Badges
            ['name' => 'Early Adopter', 'type' => 'badge', 'cost' => 400, 'value' => '#FC4100', 'description' => 'Show you were here from the start.', 'sort_order' => 1],
            ['name' => 'Trendsetter', 'type' => 'badge', 'cost' => 600, 'value' => '#a855f7', 'description' => 'For the community tastemakers.', 'sort_order' => 2],

            // Perks
            ['name' => 'Profile Spotlight', 'type' => 'perk', 'cost' => 1500, 'description' => 'Featured on the community page for a week.', 'sort_order' => 1],
            ['name' => 'Animated Avatar', 'type' => 'perk', 'cost' => 1000, 'description' => 'Unlock animated (GIF) avatars.', 'sort_order' => 2],
        ];

        foreach ($items as $item) {
            Customization::updateOrCreate(
                ['slug' => Str::slug($item['name'])],
                array_merge($item, ['slug' => Str::slug($item['name']), 'is_active' => true]),
            );
        }
    }
}
