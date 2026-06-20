<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Ensures Tech subcategories exist with correct parent_id
     */
    public function up(): void
    {
        // Find or create Tech parent
        $techParent = DB::table('categories')
            ->where('type', 'tech')
            ->whereNull('parent_id')
            ->first();

        if (! $techParent) {
            $techParentId = DB::table('categories')->insertGetId([
                'name' => 'Tech',
                'slug' => 'tech',
                'type' => 'tech',
                'icon' => 'cpu',
                'parent_id' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $techParentId = $techParent->id;
        }

        // Define tech subcategories
        $techSubs = ['News', 'Reviews', 'Benchmarks', 'Guides'];

        foreach ($techSubs as $sub) {
            $slug = Str::slug("tech-{$sub}");

            // Check if already exists
            $exists = DB::table('categories')
                ->where('slug', $slug)
                ->first();

            if (! $exists) {
                DB::table('categories')->insert([
                    'name' => $sub,
                    'slug' => $slug,
                    'type' => 'tech',
                    'parent_id' => $techParentId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                // Update existing to ensure correct parent_id and type
                DB::table('categories')
                    ->where('id', $exists->id)
                    ->update([
                        'parent_id' => $techParentId,
                        'type' => 'tech',
                        'updated_at' => now(),
                    ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Don't delete categories on rollback - too risky for production data
    }
};
