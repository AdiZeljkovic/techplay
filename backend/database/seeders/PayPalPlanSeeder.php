<?php

namespace Database\Seeders;

use App\Models\SupportTier;
use App\Services\PayPalService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;

class PayPalPlanSeeder extends Seeder
{
    protected $paypal;

    public function __construct(PayPalService $paypal)
    {
        $this->paypal = $paypal;
    }

    public function run(): void
    {
        // 1. Create Product
        try {
            $this->command->info('Creating PayPal Product for Support Tiers...');
            $product = $this->paypal->createProduct(
                'TechPlay Support',
                'Support Tiers for TechPlay Community',
                'SERVICE',
                'SOFTWARE'
            );
            $productId = $product['id'];
            $this->command->info("Product Created: $productId");

            $tiers = [
                [
                    'name' => 'TechPlay Fan',
                    'price' => 4.99,
                    'features' => [
                        'Ad-free browsing',
                        'Supporter Badge',
                        'Access to supporter-only forum',
                    ],
                    'color' => '#3B82F6', // Blue
                ],
                [
                    'name' => 'Super Fan',
                    'price' => 9.99,
                    'features' => [
                        'Everything in Fan tier',
                        'Early access to videos',
                        'Exclusive monthly newsletter',
                        'Vote on next review topic'
                    ],
                    'color' => '#8B5CF6', // Purple
                ],
                [
                    'name' => 'TechPlay Legend',
                    'price' => 19.99,
                    'features' => [
                        'Everything in Super Fan tier',
                        'Your name in video credits',
                        'Exclusive merchandise discounts',
                        'Direct chat access with editors',
                        'Legendary Badge'
                    ],
                    'color' => '#F59E0B', // Gold
                ],
            ];

            foreach ($tiers as $tierData) {
                $existing = SupportTier::where('name', $tierData['name'])->first();
                if ($existing && $existing->paypal_plan_id) {
                    $this->command->info("Tier {$tierData['name']} already exists.");
                    continue;
                }

                $this->command->info("Creating Plan for {$tierData['name']}...");
                $plan = $this->paypal->createPlan(
                    $productId,
                    $tierData['name'],
                    "Monthly subscription for {$tierData['name']}",
                    'MONTH',
                    1,
                    (string) $tierData['price'],
                    'EUR'
                );

                SupportTier::updateOrCreate(
                    ['name' => $tierData['name']],
                    [
                        'price' => $tierData['price'],
                        'currency' => 'EUR',
                        'paypal_plan_id' => $plan['id'],
                        'features' => $tierData['features'],
                        'color' => $tierData['color'],
                        'is_active' => true,
                    ]
                );

                $this->command->info("Tier {$tierData['name']} created/updated with Plan ID: {$plan['id']}");
            }

        } catch (\Exception $e) {
            $this->command->error("Failed to seed PayPal plans: " . $e->getMessage());
            Log::error($e);
        }
    }
}
