<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tiers = \App\Models\SupportTier::all(['id', 'name', 'price', 'paypal_plan_id']);
foreach ($tiers as $tier) {
    echo "ID: {$tier->id} | Name: {$tier->name} | Price: {$tier->price} | PlanID: " . ($tier->paypal_plan_id ?? 'NULL') . "\n";
}
