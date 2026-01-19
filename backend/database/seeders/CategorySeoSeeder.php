<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

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
            Category::updateOrCreate(
                ['slug' => $data['slug']], // Match strictly by SLUG only (it's unique)
                [
                    'name' => $data['name'],
                    'type' => $data['type'],
                    'seo_title' => $data['seo_title'],
                    'seo_description' => $data['seo_description'],
                    'focus_keyword' => $data['focus_keyword'],
                    'is_noindex' => false,
                ]
            );
        }
    }
}
