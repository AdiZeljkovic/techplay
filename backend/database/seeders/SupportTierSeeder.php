<?php

namespace Database\Seeders;

use App\Models\SupportTier;
use Illuminate\Database\Seeder;

class SupportTierSeeder extends Seeder
{
    public function run(): void
    {
        $tiers = [
            [
                'name' => 'TechPlay Fan',
                'price' => 5.00,
                'currency' => 'USD',
                'features' => [
                    'Profile Badge',
                    'Ad-free Experience',
                    'Support the community'
                ],
                'color' => '#14b8a6', // Teal
                'is_active' => true,
            ],
            [
                'name' => 'Super Fan',
                'price' => 15.00,
                'currency' => 'USD',
                'features' => [
                    'All Fan benefits',
                    'Gold Profile Border',
                    'Early Access to Reviews',
                    'Exclusive Discord Role'
                ],
                'color' => '#8b5cf6', // Violet
                'is_active' => true,
            ],
            [
                'name' => 'Legend',
                'price' => 50.00,
                'currency' => 'USD',
                'features' => [
                    'All Super Fan benefits',
                    'Animated Profile Badge',
                    'Name in Credits',
                    'Direct Chat with Editors',
                    'Monthly Merch Discounts'
                ],
                'color' => '#f59e0b', // Amber/Gold
                'is_active' => true,
            ],
        ];

        foreach ($tiers as $tier) {
            SupportTier::updateOrCreate(
                ['name' => $tier['name']],
                $tier
            );
        }
    }
}
