<?php

namespace Database\Seeders;

use App\Models\RewardItem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class RewardItemSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['name' => 'Bronze Profile Frame', 'type' => 'frame', 'cost' => 250, 'description' => 'A bronze ring around your avatar.', 'sort_order' => 1],
            ['name' => 'Neon Profile Theme', 'type' => 'theme', 'cost' => 500, 'description' => 'Unlock the neon dashboard accent theme.', 'sort_order' => 2],
            ['name' => 'Early Supporter Badge', 'type' => 'badge', 'cost' => 400, 'description' => 'Show off an exclusive supporter badge.', 'sort_order' => 3],
            ['name' => 'Custom Username Color', 'type' => 'perk', 'cost' => 750, 'description' => 'Stand out with a custom username color across the site.', 'sort_order' => 4],
            ['name' => '10% Shop Discount', 'type' => 'discount', 'cost' => 1000, 'description' => 'A one-time 10% discount code for the TechPlay shop.', 'stock' => 100, 'sort_order' => 5],
            ['name' => 'Featured Profile Spotlight', 'type' => 'perk', 'cost' => 1500, 'description' => 'Get your profile featured on the community page for a week.', 'stock' => 20, 'sort_order' => 6],
        ];

        foreach ($items as $item) {
            RewardItem::updateOrCreate(
                ['slug' => Str::slug($item['name'])],
                array_merge($item, ['slug' => Str::slug($item['name']), 'is_active' => true]),
            );
        }
    }
}
