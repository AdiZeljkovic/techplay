<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration {
    /**
     * DEFINITIVE CATEGORY CLEANUP
     * 
     * This migration will:
     * 1. Keep only News, Reviews, Tech as parent categories
     * 2. Delete ALL other root categories  
     * 3. Create exact subcategories specified
     * 4. Remove any orphaned/extra categories
     */
    public function up(): void
    {
        // Define the FINAL category structure
        $structure = [
            'news' => [
                'name' => 'News',
                'icon' => 'file-text',
                'children' => ['Gaming', 'PC', 'Consoles', 'Movies & TV', 'Industry', 'E-sport', 'Opinions']
            ],
            'reviews' => [
                'name' => 'Reviews',
                'icon' => 'star',
                'children' => ["Editor's Choice", 'Retro', 'Latest', 'AAA Titles', 'Indie Gems']
            ],
            'tech' => [
                'name' => 'Tech',
                'icon' => 'cpu',
                'children' => ['Reviews', 'Benchmarks', 'Guides', 'Tech News']
            ],
        ];

        // Step 1: Get or create the 3 main parent categories
        $parentIds = [];

        foreach ($structure as $type => $config) {
            $parent = DB::table('categories')
                ->where('type', $type)
                ->whereNull('parent_id')
                ->where('slug', $type)
                ->first();

            if (!$parent) {
                $parentIds[$type] = DB::table('categories')->insertGetId([
                    'name' => $config['name'],
                    'slug' => $type,
                    'type' => $type,
                    'icon' => $config['icon'],
                    'parent_id' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $parentIds[$type] = $parent->id;
            }
        }

        // Step 2: Delete ALL root categories that are NOT News, Reviews, or Tech
        DB::table('categories')
            ->whereNull('parent_id')
            ->whereNotIn('id', array_values($parentIds))
            ->delete();

        // Step 3: Create subcategories for each parent
        foreach ($structure as $type => $config) {
            $parentId = $parentIds[$type];

            foreach ($config['children'] as $childName) {
                $slug = Str::slug("{$type}-{$childName}");

                $exists = DB::table('categories')
                    ->where('slug', $slug)
                    ->first();

                if (!$exists) {
                    DB::table('categories')->insert([
                        'name' => $childName,
                        'slug' => $slug,
                        'type' => $type,
                        'parent_id' => $parentId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    // Ensure correct parent_id and type
                    DB::table('categories')
                        ->where('id', $exists->id)
                        ->update([
                            'name' => $childName,
                            'parent_id' => $parentId,
                            'type' => $type,
                            'updated_at' => now(),
                        ]);
                }
            }
        }

        // Step 4: Delete any subcategories that don't belong
        $validSlugs = [];
        foreach ($structure as $type => $config) {
            $validSlugs[] = $type; // parent slugs
            foreach ($config['children'] as $childName) {
                $validSlugs[] = Str::slug("{$type}-{$childName}");
            }
        }

        // Keep forum categories (they have type='forum')
        DB::table('categories')
            ->whereNotIn('slug', $validSlugs)
            ->where('type', '!=', 'forum')
            ->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cannot safely reverse - this is a cleanup migration
    }
};
