<?php

namespace Database\Seeders;

use App\Models\PageSeo;
use Illuminate\Database\Seeder;

class PageSeoSeeder extends Seeder
{
    public function run(): void
    {
        $pages = [
            [
                'page_path' => '/about',
                'page_name' => 'About Us',
                'meta_title' => 'About Us - Gaming News Team from Sarajevo',
                'meta_description' => 'TechPlay is a Sarajevo-based gaming and technology media outlet. Founded by passionate gamers, we deliver unbiased reviews, breaking news, and in-depth hardware analysis. Meet the team behind your favorite gaming portal.',
                'meta_keywords' => 'about TechPlay, gaming news team, Sarajevo gaming, gaming journalists, tech reviewers, gaming media outlet',
                'og_title' => 'About TechPlay - The Team Behind the News',
                'og_description' => 'Meet the passionate team of gamers and tech enthusiasts creating TechPlay content from Sarajevo, Bosnia and Herzegovina.',
            ],
            [
                'page_path' => '/contact',
                'page_name' => 'Contact',
                'meta_title' => 'Contact Us - Get in Touch with TechPlay',
                'meta_description' => 'Have a news tip, partnership inquiry, or need technical support? Contact TechPlay via email or our contact form. We respond within 24 hours.',
                'meta_keywords' => 'contact TechPlay, gaming news tip, advertising gaming, game review request, tech partnership',
                'og_title' => 'Contact TechPlay - News Tips, Partnerships & Support',
                'og_description' => 'Reach out to TechPlay for news tips, advertising inquiries, partnership opportunities, or technical support.',
            ],
            [
                'page_path' => '/news',
                'page_name' => 'Gaming News',
                'meta_title' => 'Gaming News - Breaking Headlines & Industry Updates',
                'meta_description' => 'Stay updated with the latest gaming news, industry announcements, game releases, and developer updates. Breaking stories from PlayStation, Xbox, Nintendo, and PC gaming.',
                'meta_keywords' => 'gaming news, video game news, PS5 news, Xbox news, Nintendo news, PC gaming news, game announcements, gaming industry news',
                'og_title' => 'Gaming News - Latest Headlines from TechPlay',
                'og_description' => 'Breaking gaming news, release dates, trailers, and industry updates. Your daily source for what\'s happening in gaming.',
            ],
            [
                'page_path' => '/reviews',
                'page_name' => 'Game Reviews',
                'meta_title' => 'Game Reviews - Honest Scores & In-Depth Analysis',
                'meta_description' => 'Read our comprehensive game reviews with detailed scores, benchmarks, pros and cons. From AAA titles to indie gems, we test every game thoroughly.',
                'meta_keywords' => 'game reviews, video game reviews, PS5 game reviews, Xbox game reviews, PC game reviews, gaming scores, honest game reviews',
                'og_title' => 'TechPlay Reviews - Unbiased Game Reviews & Ratings',
                'og_description' => 'In-depth game reviews with benchmark scores, gameplay analysis, and final verdicts. Find your next favorite game.',
            ],
            [
                'page_path' => '/hardware',
                'page_name' => 'Hardware Lab',
                'meta_title' => 'Hardware Lab - GPU, CPU & PC Component Reviews',
                'meta_description' => 'Benchmark-driven hardware reviews with thermal testing, FPS comparisons, and raw performance numbers. Find the best graphics cards, processors, and PC components.',
                'meta_keywords' => 'hardware reviews, GPU benchmarks, CPU reviews, graphics card reviews, PC component reviews, gaming PC parts, RTX benchmarks',
                'og_title' => 'Hardware Lab - PC Component Reviews & Benchmarks',
                'og_description' => 'In-depth hardware analysis with real-world gaming benchmarks, thermal tests, and value comparisons.',
            ],
            [
                'page_path' => '/guides',
                'page_name' => 'Gaming Guides',
                'meta_title' => 'Gaming Guides & Tutorials - Master Your Games',
                'meta_description' => 'Master your favorite games with our in-depth guides, tips, and strategy walkthroughs. From beginner tips to advanced strategies.',
                'meta_keywords' => 'gaming guides, game tutorials, game tips, walkthrough, game strategy, how to guides, gaming help',
                'og_title' => 'Gaming Guides - Tips, Tricks & Walkthroughs',
                'og_description' => 'Level up your gaming with expert guides, detailed walkthroughs, and pro tips.',
            ],
            [
                'page_path' => '/forum',
                'page_name' => 'Community Forums',
                'meta_title' => 'Community Forums - Gaming Discussions & Help',
                'meta_description' => 'Join the TechPlay community forums. Discuss games, share PC builds, get technical help, trade in the marketplace, and connect with fellow gamers.',
                'meta_keywords' => 'gaming forum, PC gaming community, gaming discussions, PC build help, gaming marketplace, esports community',
                'og_title' => 'TechPlay Forums - Gaming Community',
                'og_description' => 'A thriving community of gamers discussing games, hardware, esports, and more.',
            ],
            [
                'page_path' => '/shop',
                'page_name' => 'Shop',
                'meta_title' => 'Shop - Gaming Gear & Merchandise',
                'meta_description' => 'Official TechPlay merchandise, premium gaming gear, and exclusive hardware accessories. Support the team and level up your setup.',
                'meta_keywords' => 'gaming merchandise, gaming gear, TechPlay shop, gaming accessories, esports apparel',
                'og_title' => 'TechPlay Shop - Gaming Gear & Merch',
                'og_description' => 'Shop official TechPlay merchandise and curated gaming gear.',
            ],
            [
                'page_path' => '/videos',
                'page_name' => 'Videos',
                'meta_title' => 'Videos - Gaming Content & Reviews',
                'meta_description' => 'Watch our latest gaming videos, review gameplay footage, trailers, and exclusive content. Subscribe for new videos every week.',
                'meta_keywords' => 'gaming videos, game trailers, gameplay footage, review videos, gaming content',
                'og_title' => 'TechPlay Videos - Gaming Content',
                'og_description' => 'Watch the latest gaming videos, reviews, and exclusive content from TechPlay.',
            ],
        ];

        foreach ($pages as $page) {
            PageSeo::updateOrCreate(
                ['page_path' => $page['page_path']],
                $page
            );
        }

        $this->command->info('✅ Page SEO data seeded for ' . count($pages) . ' pages!');
    }
}
