<?php

namespace Database\Seeders;

use App\Models\SupportTier;
use Illuminate\Database\Seeder;

class SupportTierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Tier 1: Fan
        SupportTier::updateOrCreate(
            ['name' => 'TechPlay Fan'],
            [
                'price' => 4.99,
                'currency' => 'USD',
                'features' => [
                    'Ad-free browsing',
                    'Supporter Badge',
                    'Access to supporter-only forum',
                ],
                'color' => '#3B82F6', // Blue
                'is_active' => true,
                // 'paypal_plan_id' => 'P-...' // To be filled after creating plan in PayPal
            ]
        );

        // Tier 2: Super Fan
        SupportTier::updateOrCreate(
            ['name' => 'Super Fan'],
            [
                'price' => 9.99,
                'currency' => 'USD',
                'features' => [
                    'Everything in Fan tier',
                    'Early access to videos',
                    'Exclusive monthly newsletter',
                    'Vote on next review topic'
                ],
                'color' => '#8B5CF6', // Purple
                'is_active' => true,
            ]
        );

        // Tier 3: Legend
        SupportTier::updateOrCreate(
            ['name' => 'TechPlay Legend'],
            [
                'price' => 19.99,
                'currency' => 'USD',
                'features' => [
                    'Everything in Super Fan tier',
                    'Your name in video credits',
                    'Exclusive merchandise discounts',
                    'Direct chat access with editors',
                    'Legendary Badge'
                ],
                'color' => '#F59E0B', // Gold
                'is_active' => true,
            ]
        );
    }
}
