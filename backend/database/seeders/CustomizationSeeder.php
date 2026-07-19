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

            // Post Colors (forum username color)
            ['name' => 'Crimson Post Color', 'type' => 'post_color', 'cost' => 200, 'value' => '#DC2626', 'description' => 'Show your username in crimson on forum posts.', 'sort_order' => 1],
            ['name' => 'Azure Post Color', 'type' => 'post_color', 'cost' => 200, 'value' => '#2563EB', 'description' => 'Show your username in azure on forum posts.', 'sort_order' => 2],
            ['name' => 'Gold Post Color', 'type' => 'post_color', 'cost' => 350, 'value' => '#EAB308', 'description' => 'Show your username in gold on forum posts.', 'sort_order' => 3],

            // Perks
            ['name' => 'Profile Spotlight', 'type' => 'perk', 'cost' => 1500, 'description' => 'Featured on the community page for a week.', 'sort_order' => 1],
            ['name' => 'Animated Avatar', 'type' => 'perk', 'cost' => 1000, 'description' => 'Unlock animated (GIF) avatars.', 'sort_order' => 2],

            // ── V3.5 catalog expansion ──────────────────────────────────────
            // Themes
            ['name' => 'Blood Moon', 'type' => 'theme', 'cost' => 500, 'value' => '#ef4444', 'description' => 'Deep red accent for the fearless.', 'sort_order' => 6],
            ['name' => 'Synthwave Pink', 'type' => 'theme', 'cost' => 600, 'value' => '#ec4899', 'description' => 'Retro-future pink accent.', 'sort_order' => 7],
            ['name' => 'Arctic Blue', 'type' => 'theme', 'cost' => 500, 'value' => '#38bdf8', 'description' => 'Cool arctic blue accent.', 'sort_order' => 8],
            ['name' => 'Amber Rush', 'type' => 'theme', 'cost' => 500, 'value' => '#f59e0b', 'description' => 'Warm amber accent.', 'sort_order' => 9],
            ['name' => 'Ghost White', 'type' => 'theme', 'cost' => 900, 'value' => '#e5e7eb', 'description' => 'Minimalist monochrome accent.', 'sort_order' => 10],

            // Frames
            ['name' => 'Inferno Ring', 'type' => 'frame', 'cost' => 700, 'value' => 'linear-gradient(135deg,#ef4444,#f59e0b,#FC4100)', 'description' => 'Blazing fire gradient ring.', 'sort_order' => 5],
            ['name' => 'Void Ring', 'type' => 'frame', 'cost' => 700, 'value' => 'linear-gradient(135deg,#111827,#6d28d9,#111827)', 'description' => 'Dark energy pulsing from the void.', 'sort_order' => 6],
            ['name' => 'Synthwave Ring', 'type' => 'frame', 'cost' => 800, 'value' => 'linear-gradient(135deg,#ec4899,#8b5cf6,#38bdf8)', 'description' => 'Retro sunset gradient ring.', 'sort_order' => 7],

            // Badges
            ['name' => 'Completionist', 'type' => 'badge', 'cost' => 800, 'value' => '#22c55e', 'description' => 'For those who finish what they start.', 'sort_order' => 3],
            ['name' => 'Night Owl', 'type' => 'badge', 'cost' => 500, 'value' => '#8b5cf6', 'description' => 'The 3AM gaming session crew.', 'sort_order' => 4],
            ['name' => 'Speedrunner', 'type' => 'badge', 'cost' => 700, 'value' => '#38bdf8', 'description' => 'Gotta go fast.', 'sort_order' => 5],
            ['name' => 'Lore Master', 'type' => 'badge', 'cost' => 700, 'value' => '#f59e0b', 'description' => 'Reads every codex entry.', 'sort_order' => 6],

            // Post colors
            ['name' => 'Emerald Post Color', 'type' => 'post_color', 'cost' => 200, 'value' => '#10B981', 'description' => 'Show your username in emerald on forum posts.', 'sort_order' => 4],
            ['name' => 'Violet Post Color', 'type' => 'post_color', 'cost' => 250, 'value' => '#8B5CF6', 'description' => 'Show your username in violet on forum posts.', 'sort_order' => 5],
        ];

        foreach ($items as $item) {
            Customization::updateOrCreate(
                ['slug' => Str::slug($item['name'])],
                array_merge($item, ['slug' => Str::slug($item['name']), 'is_active' => true]),
            );
        }
    }
}
