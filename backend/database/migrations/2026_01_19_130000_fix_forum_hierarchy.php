<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        // Define the hierarchy we want to restore
        $structure = [
            'Community' => [
                'icon' => 'users',
                'children' => ['news-announcements', 'feedback-support', 'the-lounge']
            ],
            'Gaming' => [
                'icon' => 'gamepad-2',
                'children' => ['general-gaming', 'game-reviews', 'user-reviews', 'esports']
            ],
            'Hardware' => [
                'icon' => 'cpu',
                'children' => ['pc-builds', 'consoles', 'peripherals']
            ],
            'Marketplace' => [
                'icon' => 'shopping-bag',
                'children' => ['marketplace', 'buy-sell-trade']
            ]
        ];

        foreach ($structure as $parentName => $data) {
            // Find or create Parent Category
            $parent = DB::table('categories')
                ->where('name', $parentName)
                ->where('type', 'forum')
                ->whereNull('parent_id')
                ->first();

            $parentId = $parent ? $parent->id : DB::table('categories')->insertGetId([
                'name' => $parentName,
                'slug' => Str::slug($parentName),
                'description' => "Official {$parentName} Area",
                'type' => 'forum',
                'icon' => $data['icon'],
                'parent_id' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Assign Children
            foreach ($data['children'] as $childSlug) {
                DB::table('categories')
                    ->where('slug', $childSlug) // Try exact matches first
                    ->orWhere('slug', 'like', "%{$childSlug}%") // Fallback for variations
                    ->where('type', 'forum')
                    ->update([
                        'parent_id' => $parentId,
                        'updated_at' => now()
                    ]);
            }
        }
    }

    public function down(): void
    {
        // Optional: Flatten again (remove parent_ids)
    }
};
