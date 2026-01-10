<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use Illuminate\Support\Str;

class ForumCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'The Lounge',
                'description' => 'General community discussions and hangouts.',
                'icon' => 'coffee',
                'children' => [
                    ['name' => 'General Chat', 'description' => 'Talk about anything and everything.'],
                    ['name' => 'Introductions', 'description' => 'New to the community? Say hello!'],
                    ['name' => 'Gaming News', 'description' => 'Discuss the latest headlines from the gaming world.'],
                ]
            ],
            [
                'name' => 'Platforms',
                'description' => 'Dedicated discussions for your favorite gaming platforms.',
                'icon' => 'monitor',
                'children' => [
                    ['name' => 'PC Gaming', 'description' => 'Master Race discussions, Steam, Epic, and more.'],
                    ['name' => 'PlayStation', 'description' => 'Everything PS5, PS4, and exclusives.'],
                    ['name' => 'Xbox', 'description' => 'Xbox Series X|S, Game Pass, and Halo.'],
                    ['name' => 'Nintendo', 'description' => 'Switch, Mario, Zelda, and portable gaming.'],
                    ['name' => 'Mobile Gaming', 'description' => 'iOS, Android, and handheld emulation.'],
                ]
            ],
            [
                'name' => 'Genres',
                'description' => 'Deep dive into specific game genres.',
                'icon' => 'swords',
                'children' => [
                    ['name' => 'Action & Adventure', 'description' => 'From Uncharted to Assassin\'s Creed.'],
                    ['name' => 'RPG & MMO', 'description' => 'Role-playing games, WoW, FFXIV, and D&D.'],
                    ['name' => 'FPS & Shooters', 'description' => 'Call of Duty, Battlefield, Valorant, and CS2.'],
                    ['name' => 'Strategy & Sim', 'description' => 'Civilization, Sims, RTS, and turn-based tactics.'],
                    ['name' => 'Sports & Racing', 'description' => 'FIFA, NBA 2K, Forza, and Gran Turismo.'],
                ]
            ],
            [
                'name' => 'Tech & Hardware',
                'description' => 'Get technical with builds, gears, and troubleshooting.',
                'icon' => 'cpu',
                'children' => [
                    ['name' => 'PC Builds', 'description' => 'Show off your rig or get advice on a new build.'],
                    ['name' => 'Peripherals', 'description' => 'Keyboards, mice, monitors, and audio gear.'],
                    ['name' => 'Tech Support', 'description' => 'Having trouble? Ask the community for help.'],
                ]
            ],
            [
                'name' => 'Marketplace',
                'description' => 'Buy, sell, and trade games and hardware.',
                'icon' => 'shopping-bag',
                'children' => [
                    ['name' => 'Hot Deals', 'description' => 'Share the best discounts and sales found online.'],
                    ['name' => 'Buy / Sell / Trade', 'description' => 'Community trading (Trade at your own risk).'],
                ]
            ],
            [
                'name' => 'Site Support',
                'description' => 'Feedback and support for TechPlay.',
                'icon' => 'life-buoy',
                'children' => [
                    ['name' => 'Announcements', 'description' => 'Official updates and news from the TechPlay team.'],
                    ['name' => 'Suggestions', 'description' => 'How can we improve the site? Let us know.'],
                    ['name' => 'Bug Reports', 'description' => 'Found a glitch? Report it here.'],
                ]
            ],
        ];

        foreach ($categories as $categoryData) {
            $parent = Category::create([
                'name' => $categoryData['name'],
                'slug' => Str::slug($categoryData['name']),
                'type' => 'forum', // Important: Type is forum
                'description' => $categoryData['description'],
                'icon' => $categoryData['icon'],
            ]);

            if (isset($categoryData['children'])) {
                foreach ($categoryData['children'] as $childData) {
                    Category::create([
                        'name' => $childData['name'],
                        'slug' => Str::slug($childData['name']),
                        'type' => 'forum',
                        'description' => $childData['description'],
                        'parent_id' => $parent->id,
                    ]);
                }
            }
        }
    }
}
