<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. NEWS
        $news = Category::create([
            'name' => 'News',
            'slug' => 'news',
            'type' => 'news',
            'icon' => 'file-text'
        ]);

        $newsSubs = ['Gaming', 'Consoles', 'PC', 'Movies & TV', 'Industry', 'E-sport', 'Opinions'];
        foreach ($newsSubs as $sub) {
            Category::create([
                'name' => $sub,
                'slug' => Str::slug("news-$sub"), // unique slug
                'parent_id' => $news->id,
                'type' => 'news'
            ]);
        }

        // 2. REVIEWS
        $reviews = Category::create([
            'name' => 'Reviews',
            'slug' => 'reviews',
            'type' => 'reviews',
            'icon' => 'star'
        ]);

        $reviewSubs = ['Latest', "Editor's Choice", 'AAA Titles', 'Indie Gems', 'Retro'];
        foreach ($reviewSubs as $sub) {
            Category::create([
                'name' => $sub,
                'slug' => Str::slug("reviews-$sub"),
                'parent_id' => $reviews->id,
                'type' => 'reviews'
            ]);
        }

        // 3. TECH (Hardware)
        $tech = Category::create([
            'name' => 'Tech',
            'slug' => 'tech',
            'type' => 'tech',
            'icon' => 'cpu'
        ]);

        $techSubs = ['News', 'Reviews', 'Benchmarks', 'Guides'];
        foreach ($techSubs as $sub) {
            Category::create([
                'name' => $sub,
                'slug' => Str::slug("tech-$sub"),
                'parent_id' => $tech->id,
                'type' => 'tech'
            ]);
        }
    }
}
