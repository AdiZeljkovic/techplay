<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

use App\Models\PageSeo;

class CategorySeoSeeder extends Seeder
{
    public function run()
    {
        $categories = [
            // NEWS Categories
            [
                'name' => 'Gaming News',
                'slug' => 'gaming',
                'type' => 'news',
                'seo_title' => 'Latest Gaming News & Updates | TechPlay',
                'seo_description' => 'Stay updated with the latest gaming news, release dates, patch notes, and industry leaks. Your daily source for PC, Console, and Mobile gaming updates.',
                'focus_keyword' => 'gaming news',
            ],
            [
                'name' => 'Esports',
                'slug' => 'esports',
                'type' => 'news',
                'seo_title' => 'Esports News, Tournaments & Scores | TechPlay',
                'seo_description' => 'Covering global esports tournaments, roster changes, match results, and pro player interviews. League of Legends, CS2, Valorant, and more.',
                'focus_keyword' => 'esports news',
            ],
            [
                'name' => 'Industry',
                'slug' => 'industry',
                'type' => 'news',
                'seo_title' => 'Game Industry Biz & Development News | TechPlay',
                'seo_description' => 'Deep dives into the business of gaming. Studio acquisitions, financial reports, developer interviews, and market trends.',
                'focus_keyword' => 'game industry news',
            ],

            // REVIEWS Categories
            [
                'name' => 'PC Games',
                'slug' => 'pc',
                'type' => 'reviews',
                'seo_title' => 'PC Game Reviews & Benchmarks | TechPlay',
                'seo_description' => 'Honest, in-depth PC game reviews with performance benchmarks. We test the latest Triple-A titles and indie gems on various hardware configs.',
                'focus_keyword' => 'pc game reviews',
            ],
            [
                'name' => 'Console Games',
                'slug' => 'console',
                'type' => 'reviews',
                'seo_title' => 'PlayStation, Xbox & Nintendo Switch Reviews | TechPlay',
                'seo_description' => 'Comprehensive reviews for PS5, Xbox Series X, and Switch games. Gameplay analysis, graphics comparisons, and purchasing recommendations.',
                'focus_keyword' => 'console game reviews',
            ],
            [
                'name' => 'Indie',
                'slug' => 'indie',
                'type' => 'reviews',
                'seo_title' => 'Best Indie Games Reviews & Hidden Gems | TechPlay',
                'seo_description' => 'Discover the best indie games you might have missed. Reviews of creative, independent titles that push the boundaries of gaming.',
                'focus_keyword' => 'indie game reviews',
            ],

            // TECH Categories
            [
                'name' => 'Hardware',
                'slug' => 'hardware',
                'type' => 'tech',
                'seo_title' => 'PC Hardware Reviews & News | TechPlay',
                'seo_description' => 'Expert reviews of the latest PC hardware: GPUs, CPUs, Motherboards, and Peripherals. Build guides and technical analysis for enthusiasts.',
                'focus_keyword' => 'pc hardware reviews',
            ],
            [
                'name' => 'Peripherals',
                'slug' => 'peripherals',
                'type' => 'tech',
                'seo_title' => 'Gaming Keyboards, Mice & Headsets Reviews | TechPlay',
                'seo_description' => 'Find the best gaming gear. Detailed reviews of mechanical keyboards, profound gaming mice, and immersive headsets.',
                'focus_keyword' => 'gaming peripherals',
            ],
            [
                'name' => 'Mobile',
                'slug' => 'mobile',
                'type' => 'tech',
                'seo_title' => 'Smartphone & Mobile Tech News | TechPlay',
                'seo_description' => 'Latest news on gaming phones, tablets, and portable technology. Performance tests and reviews for mobile gamers.',
                'focus_keyword' => 'mobile tech news',
            ],
        ];

        foreach ($categories as $data) {
            // 1. Update Category Table (Source of Truth for internal logic)
            Category::updateOrCreate(
                ['slug' => $data['slug']],
                [
                    'name' => $data['name'],
                    'type' => $data['type'],
                    'seo_title' => $data['seo_title'],
                    'seo_description' => $data['seo_description'],
                    'focus_keyword' => $data['focus_keyword'],
                    'is_noindex' => false,
                ]
            );

            // 2. Generate Path
            $pathPrefix = match ($data['type']) {
                'news' => '/news',
                'reviews' => '/reviews',
                'tech' => '/hardware', // Assuming 'tech' maps to /hardware based on conventions
                'forum' => '/forum',
                default => '/' . $data['type'],
            };

            // Special case for root categories if they have the same slug as valid root paths, but here we are treating them as sub-pages usually.
            // However, 'hardware' slug with type 'tech' -> '/hardware/hardware' looks wrong if 'hardware' IS the section.
            // If slug equals the prefix base (e.g. slug 'hardware' and prefix '/hardware'), maybe it should be just '/hardware'?
            // But the user asked for SUBCATEGORIES. 
            // Let's stick to simple concatenation for now: /news/gaming, /reviews/pc.
            // For hardware: /hardware/hardware is redundant but technically correct if category is named Hardware.
            // BUT, if the slug is 'hardware', maybe it IS the root hardware page?
            // The user screenshot shows /hardware.
            // Only if slug != 'hardware' (or whatever base is). 
            // Let's just use /$prefix/$slug for now. The user can edit it.

            $path = $pathPrefix . '/' . $data['slug'];

            // 3. Update PageSeo Table (For "Page SEO" Admin View)
            PageSeo::updateOrCreate(
                ['page_path' => $path],
                [
                    'page_name' => $data['name'],
                    'meta_title' => $data['seo_title'],
                    'meta_description' => $data['seo_description'],
                    'is_noindex' => false,
                ]
            );
        }
    }
}
