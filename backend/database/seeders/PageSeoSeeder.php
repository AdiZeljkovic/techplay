<?php

namespace Database\Seeders;

use App\Models\PageSeo;
use Illuminate\Database\Seeder;

class PageSeoSeeder extends Seeder
{
    public function run(): void
    {
        $pages = [
            // Main content pages
            ['page_path' => '/', 'page_name' => 'Homepage', 'meta_title' => 'TechPlay - Gaming & Tech News Portal', 'meta_description' => 'Your source for gaming news, reviews, benchmarks, and tech insights. Breaking headlines, in-depth reviews, and expert analysis from passionate gamers.', 'meta_keywords' => 'gaming news, game reviews, tech news, hardware reviews, esports, gaming portal'],
            ['page_path' => '/about', 'page_name' => 'About Us', 'meta_title' => 'About Us - Gaming News Team from Sarajevo | TechPlay', 'meta_description' => 'TechPlay is a Sarajevo-based gaming and technology media outlet. Founded by passionate gamers, we deliver unbiased reviews, breaking news, and in-depth hardware analysis.', 'meta_keywords' => 'about TechPlay, gaming news team, Sarajevo gaming, gaming journalists, tech reviewers'],
            ['page_path' => '/contact', 'page_name' => 'Contact', 'meta_title' => 'Contact Us - Get in Touch | TechPlay', 'meta_description' => 'Have a news tip, partnership inquiry, or need support? Contact TechPlay via email or our contact form. We respond within 24 hours.', 'meta_keywords' => 'contact TechPlay, gaming news tip, advertising, partnership'],
            ['page_path' => '/marketing', 'page_name' => 'Marketing & Advertising', 'meta_title' => 'Advertising & Partnerships | TechPlay', 'meta_description' => 'Partner with TechPlay to reach gaming enthusiasts. Explore advertising options, sponsored content, and partnership opportunities.', 'meta_keywords' => 'gaming advertising, gaming marketing, esports sponsorship, game promotion'],

            // Content sections
            ['page_path' => '/videos', 'page_name' => 'Videos', 'meta_title' => 'Gaming Videos & Reviews | TechPlay', 'meta_description' => 'Watch gaming videos, reviews, trailers, and exclusive content. Subscribe for new videos every week.', 'meta_keywords' => 'gaming videos, game trailers, gameplay footage, review videos'],
            ['page_path' => '/guides', 'page_name' => 'Gaming Guides', 'meta_title' => 'Gaming Guides & Tutorials | TechPlay', 'meta_description' => 'Master your favorite games with in-depth guides, tips, and strategy walkthroughs. From beginner tips to advanced strategies.', 'meta_keywords' => 'gaming guides, game tutorials, walkthrough, game strategy'],
            ['page_path' => '/games', 'page_name' => 'Games Database', 'meta_title' => 'Games Database - Discover Your Next Adventure | TechPlay', 'meta_description' => 'Explore our extensive database of video games. Find release dates, platforms, genres, and ratings for thousands of titles.', 'meta_keywords' => 'video games database, game release dates, new games, upcoming games'],
            ['page_path' => '/calendar', 'page_name' => 'Release Calendar', 'meta_title' => 'Game Release Calendar - Upcoming Titles | TechPlay', 'meta_description' => 'Stay ahead with our up-to-date release calendar. See upcoming game releases on all major platforms.', 'meta_keywords' => 'game release calendar, upcoming games, release dates'],
            ['page_path' => '/forum', 'page_name' => 'Community Forums', 'meta_title' => 'Community Forums - Gaming Discussions | TechPlay', 'meta_description' => 'Join the TechPlay community forums. Discuss games, share PC builds, get help, and connect with fellow gamers.', 'meta_keywords' => 'gaming forum, PC gaming community, gaming discussions'],
            ['page_path' => '/shop', 'page_name' => 'Shop', 'meta_title' => 'Shop - Gaming Gear & Merchandise | TechPlay', 'meta_description' => 'Official TechPlay merchandise, premium gaming gear, and exclusive accessories. Support the team and level up your setup.', 'meta_keywords' => 'gaming merchandise, gaming gear, TechPlay shop'],
            // Two things called support, meaning opposite things: this page
            // takes donations, and the help centre lives on help.techplay.gg.
            // The row below described a support centre for eight months while
            // the page asked for money — see the 2026_09_03_100001 migration.
            // Label it "Support us" everywhere and the confusion stays fixed.
            ['page_path' => '/support', 'page_name' => 'Support us', 'meta_title' => 'Support Us — Back Independent Gaming Media | TechPlay', 'meta_description' => 'TechPlay runs without a publisher behind it. Back the site with a one-off contribution or a monthly supporter tier, and help keep the reviews independent.', 'meta_keywords' => 'support techplay, donate, supporter tiers, independent gaming media'],
            ['page_path' => '/help', 'page_name' => 'Help centre', 'meta_title' => 'Help Centre — Answers and Troubleshooting | TechPlay', 'meta_description' => 'Answers to what we are asked most: sign-in trouble, connecting Steam, Xbox, PlayStation, GOG and Epic, how XP works, emails, and what happens to your data.', 'meta_keywords' => 'techplay help, help centre, account help, connect steam account'],

            // Legal pages
            ['page_path' => '/privacy', 'page_name' => 'Privacy Policy', 'meta_title' => 'Privacy Policy | TechPlay', 'meta_description' => 'Read our Privacy Policy to understand how we collect, use, and protect your personal data.', 'meta_keywords' => 'privacy policy, data protection, GDPR'],
            ['page_path' => '/terms', 'page_name' => 'Terms of Service', 'meta_title' => 'Terms of Service | TechPlay', 'meta_description' => 'Review our Terms of Service. These terms govern your use of TechPlay services.', 'meta_keywords' => 'terms of service, user agreement'],
            ['page_path' => '/cookies', 'page_name' => 'Cookie Policy', 'meta_title' => 'Cookie Policy | TechPlay', 'meta_description' => 'Learn how we use cookies to improve your experience. Manage your cookie preferences.', 'meta_keywords' => 'cookie policy, cookies usage'],
            ['page_path' => '/impressum', 'page_name' => 'Impressum', 'meta_title' => 'Impressum - Legal Notice | TechPlay', 'meta_description' => 'Legal information about TechPlay. Company details and editorial responsibility.', 'meta_keywords' => 'impressum, legal notice'],
            ['page_path' => '/rating-system', 'page_name' => 'Our Rating System', 'meta_title' => 'Our Rating System - How We Score Games | TechPlay', 'meta_description' => 'Learn how we rate and review games. Our transparent scoring methodology explained.', 'meta_keywords' => 'game rating system, review methodology, scoring games'],

            // Auth pages (noindex)
            ['page_path' => '/login', 'page_name' => 'Login', 'meta_title' => 'Sign In | TechPlay', 'meta_description' => 'Sign in to your TechPlay account to access community features.', 'meta_keywords' => '', 'is_noindex' => true],
            ['page_path' => '/register', 'page_name' => 'Register', 'meta_title' => 'Create Account | TechPlay', 'meta_description' => 'Join the TechPlay community. Create your free account today.', 'meta_keywords' => '', 'is_noindex' => true],

            // ========================================
            // PARENT CATEGORIES
            // ========================================
            ['page_path' => '/news', 'page_name' => 'News (Parent Category)', 'meta_title' => 'Gaming News - Breaking Headlines & Industry Updates | TechPlay', 'meta_description' => 'Stay updated with the latest gaming news, industry announcements, game releases, and developer updates. Breaking stories from PlayStation, Xbox, Nintendo, and PC gaming.', 'meta_keywords' => 'gaming news, video game news, PS5 news, Xbox news, Nintendo news, PC gaming news'],
            ['page_path' => '/reviews', 'page_name' => 'Reviews (Parent Category)', 'meta_title' => 'Game Reviews - Honest Scores & In-Depth Analysis | TechPlay', 'meta_description' => 'Read our comprehensive game reviews with detailed scores, benchmarks, pros and cons. From AAA titles to indie gems.', 'meta_keywords' => 'game reviews, video game reviews, gaming scores, honest reviews'],
            ['page_path' => '/hardware', 'page_name' => 'Hardware/Tech (Parent Category)', 'meta_title' => 'Hardware Lab - GPU, CPU & PC Component Reviews | TechPlay', 'meta_description' => 'Benchmark-driven hardware reviews with thermal testing, FPS comparisons, and raw performance numbers. Find the best graphics cards, processors, and components.', 'meta_keywords' => 'hardware reviews, GPU benchmarks, CPU reviews, graphics card reviews'],

            // ========================================
            // NEWS SUBCATEGORIES
            // ========================================
            ['page_path' => '/news/gaming', 'page_name' => 'News: Gaming', 'meta_title' => 'Gaming News - Latest Game Announcements | TechPlay', 'meta_description' => 'Breaking gaming news covering new releases, updates, trailers, and announcements from the biggest game publishers.', 'meta_keywords' => 'gaming news, game announcements, new games, gaming updates'],
            ['page_path' => '/news/pc', 'page_name' => 'News: PC', 'meta_title' => 'PC Gaming News - Steam, Epic & More | TechPlay', 'meta_description' => 'PC gaming news covering Steam sales, Epic exclusives, hardware requirements, and everything PC gamers need to know.', 'meta_keywords' => 'PC gaming news, Steam news, Epic Games, PC game releases'],
            ['page_path' => '/news/consoles', 'page_name' => 'News: Consoles', 'meta_title' => 'Console News - PlayStation, Xbox & Nintendo | TechPlay', 'meta_description' => 'Console gaming news for PlayStation 5, Xbox Series X|S, and Nintendo Switch. Exclusives, updates, and system news.', 'meta_keywords' => 'console news, PS5 news, Xbox news, Nintendo Switch news'],
            ['page_path' => '/news/movies-tv', 'page_name' => 'News: Movies & TV', 'meta_title' => 'Gaming Movies & TV News | TechPlay', 'meta_description' => 'News about game adaptations, gaming documentaries, and entertainment crossovers. Movie and TV coverage for gamers.', 'meta_keywords' => 'gaming movies, game adaptations, gaming TV shows'],
            ['page_path' => '/news/industry', 'page_name' => 'News: Industry', 'meta_title' => 'Gaming Industry News - Business & Trends | TechPlay', 'meta_description' => 'Gaming industry news covering mergers, acquisitions, studio updates, and business trends in the gaming world.', 'meta_keywords' => 'gaming industry, game business, studio news, gaming trends'],
            ['page_path' => '/news/e-sport', 'page_name' => 'News: E-sport', 'meta_title' => 'Esports News - Tournaments & Pro Gaming | TechPlay', 'meta_description' => 'Esports news covering major tournaments, team rosters, prize pools, and competitive gaming updates.', 'meta_keywords' => 'esports news, gaming tournaments, pro gaming, competitive gaming'],
            ['page_path' => '/news/opinions', 'page_name' => 'News: Opinions', 'meta_title' => 'Gaming Opinions & Editorials | TechPlay', 'meta_description' => 'Gaming opinions, editorials, and thought pieces from our team. Hot takes and in-depth analysis.', 'meta_keywords' => 'gaming opinions, gaming editorials, game analysis'],

            // ========================================
            // REVIEWS SUBCATEGORIES
            // ========================================
            ['page_path' => '/reviews/latest', 'page_name' => 'Reviews: Latest', 'meta_title' => 'Latest Game Reviews | TechPlay', 'meta_description' => 'Our most recent game reviews. Fresh verdicts on the newest releases across all platforms.', 'meta_keywords' => 'latest game reviews, new game reviews, recent reviews'],
            ['page_path' => '/reviews/editors-choice', 'page_name' => "Reviews: Editor's Choice", 'meta_title' => "Editor's Choice Games - Top Rated | TechPlay", 'meta_description' => "Games that earned our Editor's Choice award. The best of the best, handpicked by our review team.", 'meta_keywords' => "editor's choice games, top rated games, best games"],
            ['page_path' => '/reviews/retro', 'page_name' => 'Reviews: Retro', 'meta_title' => 'Retro Game Reviews - Classic Gaming | TechPlay', 'meta_description' => 'Revisiting classic games with modern eyes. Retro reviews of beloved titles from gaming history.', 'meta_keywords' => 'retro game reviews, classic games, vintage gaming'],
            ['page_path' => '/reviews/aaa-titles', 'page_name' => 'Reviews: AAA Titles', 'meta_title' => 'AAA Game Reviews - Big Budget Games | TechPlay', 'meta_description' => 'Reviews of major AAA releases from the biggest publishers. High-budget games put to the test.', 'meta_keywords' => 'AAA game reviews, big budget games, major releases'],
            ['page_path' => '/reviews/indie-gems', 'page_name' => 'Reviews: Indie Gems', 'meta_title' => 'Indie Game Reviews - Hidden Gems | TechPlay', 'meta_description' => 'Discover the best indie games. Reviews of hidden gems and standout titles from independent developers.', 'meta_keywords' => 'indie game reviews, indie gems, independent games'],

            // ========================================
            // TECH/HARDWARE SUBCATEGORIES
            // ========================================
            ['page_path' => '/hardware/reviews', 'page_name' => 'Tech: Reviews', 'meta_title' => 'Hardware Reviews - In-Depth Tech Analysis | TechPlay', 'meta_description' => 'Detailed hardware reviews with benchmarks, thermal testing, and real-world performance analysis.', 'meta_keywords' => 'hardware reviews, tech reviews, component reviews'],
            ['page_path' => '/hardware/benchmarks', 'page_name' => 'Tech: Benchmarks', 'meta_title' => 'Benchmarks - Performance Testing & Comparisons | TechPlay', 'meta_description' => 'Hardware benchmarks comparing GPUs, CPUs, and gaming performance. Data-driven analysis for smart purchases.', 'meta_keywords' => 'hardware benchmarks, GPU benchmarks, CPU benchmarks, performance testing'],
            ['page_path' => '/hardware/guides', 'page_name' => 'Tech: Guides', 'meta_title' => 'Hardware Guides - Build Tips & Tutorials | TechPlay', 'meta_description' => 'Hardware guides for building PCs, optimizing settings, and getting the most from your gaming setup.', 'meta_keywords' => 'hardware guides, PC building, optimization guides'],
            ['page_path' => '/hardware/news', 'page_name' => 'Tech: Tech News', 'meta_title' => 'Tech News - Hardware & Technology Updates | TechPlay', 'meta_description' => 'Technology news covering new hardware releases, driver updates, and industry developments.', 'meta_keywords' => 'tech news, hardware news, GPU news, CPU news'],
        ];

        foreach ($pages as $page) {
            PageSeo::updateOrCreate(
                ['page_path' => $page['page_path']],
                array_merge([
                    'og_title' => $page['meta_title'] ?? null,
                    'og_description' => $page['meta_description'] ?? null,
                    'is_noindex' => false,
                ], $page)
            );
        }

        $this->command->info('✅ Page SEO data seeded for '.count($pages).' pages!');
    }
}
