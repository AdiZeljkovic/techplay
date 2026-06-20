<?php

namespace Database\Seeders;

use App\Models\MediaKitSetting;
use Illuminate\Database\Seeder;

class MediaKitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            // About Section
            [
                'key' => 'about_title',
                'value' => 'TechPlay - Global Gaming & Tech Media Portal',
                'type' => 'text',
                'section' => 'about',
                'order' => 1,
                'is_visible' => true,
            ],
            [
                'key' => 'about_description',
                'value' => 'TechPlay is a premier gaming and technology media portal, delivering cutting-edge news, in-depth reviews, comprehensive guides, and expert insights to a global audience of tech enthusiasts and gamers. Recently launched on the international market, we combine professional journalism with deep industry expertise to serve a passionate, engaged community.',
                'type' => 'text',
                'section' => 'about',
                'order' => 2,
                'is_visible' => true,
            ],
            [
                'key' => 'about_mission',
                'value' => 'Our mission is to empower gamers and tech enthusiasts with reliable information, expert opinions, and actionable insights that help them make informed decisions about gaming hardware, software, and emerging technologies.',
                'type' => 'text',
                'section' => 'about',
                'order' => 3,
                'is_visible' => true,
            ],

            // Content Strategy
            [
                'key' => 'content_categories',
                'value' => json_encode([
                    'Gaming News',
                    'Tech News',
                    'Hardware Reviews',
                    'Game Reviews',
                    'Buying Guides',
                    'How-To Tutorials',
                    'Industry Analysis',
                ]),
                'type' => 'json',
                'section' => 'content',
                'order' => 1,
                'is_visible' => true,
            ],
            [
                'key' => 'content_frequency',
                'value' => 'We publish 15-25 pieces of original content weekly, including breaking news, reviews, and editorial features.',
                'type' => 'text',
                'section' => 'content',
                'order' => 2,
                'is_visible' => true,
            ],
            [
                'key' => 'content_quality',
                'value' => 'All content is created by experienced gaming journalists and tech experts with proven industry credentials.',
                'type' => 'text',
                'section' => 'content',
                'order' => 3,
                'is_visible' => true,
            ],

            // Audience Demographics
            [
                'key' => 'audience_description',
                'value' => 'Our audience consists primarily of tech-savvy millennials and Gen Z consumers with high purchasing power and strong brand loyalty.',
                'type' => 'text',
                'section' => 'audience',
                'order' => 1,
                'is_visible' => true,
            ],
            [
                'key' => 'audience_demographics',
                'value' => json_encode([
                    'Age 18-24' => '35%',
                    'Age 25-34' => '45%',
                    'Age 35-44' => '15%',
                    'Age 45+' => '5%',
                ]),
                'type' => 'json',
                'section' => 'audience',
                'order' => 2,
                'is_visible' => true,
            ],
            [
                'key' => 'audience_interests',
                'value' => json_encode([
                    'PC Gaming',
                    'Console Gaming',
                    'Mobile Gaming',
                    'PC Hardware',
                    'Consumer Electronics',
                    'Esports',
                    'Game Development',
                ]),
                'type' => 'json',
                'section' => 'audience',
                'order' => 3,
                'is_visible' => true,
            ],

            // Social Media
            [
                'key' => 'social_facebook_url',
                'value' => 'https://www.facebook.com/techplaymedia',
                'type' => 'text',
                'section' => 'social',
                'order' => 1,
                'is_visible' => true,
            ],
            [
                'key' => 'social_facebook_followers',
                'value' => '8500',
                'type' => 'number',
                'section' => 'social',
                'order' => 2,
                'is_visible' => true,
            ],
            [
                'key' => 'social_instagram_url',
                'value' => 'https://www.instagram.com/techplaymedia/',
                'type' => 'text',
                'section' => 'social',
                'order' => 3,
                'is_visible' => true,
            ],
            [
                'key' => 'social_instagram_followers',
                'value' => '3200',
                'type' => 'number',
                'section' => 'social',
                'order' => 4,
                'is_visible' => true,
            ],
            [
                'key' => 'social_youtube_url',
                'value' => 'https://www.youtube.com/@TechPlayMedia',
                'type' => 'text',
                'section' => 'social',
                'order' => 5,
                'is_visible' => true,
            ],
            [
                'key' => 'social_youtube_subscribers',
                'value' => '1500',
                'type' => 'number',
                'section' => 'social',
                'order' => 6,
                'is_visible' => true,
            ],
            [
                'key' => 'social_tiktok_url',
                'value' => 'https://www.tiktok.com/@techplaymedia',
                'type' => 'text',
                'section' => 'social',
                'order' => 7,
                'is_visible' => true,
            ],
            [
                'key' => 'social_tiktok_followers',
                'value' => '2800',
                'type' => 'number',
                'section' => 'social',
                'order' => 8,
                'is_visible' => true,
            ],

            // Statistics (Manual fallback values)
            [
                'key' => 'enable_ga4_integration',
                'value' => '0',
                'type' => 'boolean',
                'section' => 'stats',
                'order' => 1,
                'is_visible' => true,
            ],
            [
                'key' => 'manual_monthly_visitors',
                'value' => '50000',
                'type' => 'number',
                'section' => 'stats',
                'order' => 2,
                'is_visible' => true,
            ],
            [
                'key' => 'manual_avg_session',
                'value' => '4:32',
                'type' => 'text',
                'section' => 'stats',
                'order' => 3,
                'is_visible' => true,
            ],
            [
                'key' => 'manual_bounce_rate',
                'value' => '42%',
                'type' => 'text',
                'section' => 'stats',
                'order' => 4,
                'is_visible' => true,
            ],
            [
                'key' => 'manual_pages_per_session',
                'value' => '3.8',
                'type' => 'text',
                'section' => 'stats',
                'order' => 5,
                'is_visible' => true,
            ],

            // Development & Roadmap
            [
                'key' => 'development_roadmap',
                'value' => 'Our development roadmap includes video content expansion, podcast launches, community forums, interactive tools, and mobile app development.',
                'type' => 'text',
                'section' => 'development',
                'order' => 1,
                'is_visible' => true,
            ],
            [
                'key' => 'upcoming_features',
                'value' => json_encode([
                    'Q2 2026: YouTube Channel Expansion',
                    'Q3 2026: Interactive PC Builder Tool',
                    'Q3 2026: Community Forums Launch',
                    'Q4 2026: Weekly Gaming Podcast',
                    'Q1 2027: Mobile App (iOS & Android)',
                ]),
                'type' => 'json',
                'section' => 'development',
                'order' => 2,
                'is_visible' => true,
            ],
            [
                'key' => 'current_initiatives',
                'value' => json_encode([
                    'Expanding editorial team',
                    'Building influencer partnerships',
                    'Developing branded content studio',
                    'Enhancing SEO & technical performance',
                ]),
                'type' => 'json',
                'section' => 'development',
                'order' => 3,
                'is_visible' => true,
            ],

            // Ad Formats - Standard (CPM)
            [
                'key' => 'ad_formats_standard',
                'value' => json_encode([
                    ['name' => 'Desktop Leaderboard', 'dimensions' => '728x90', 'cpm' => '$1.00', 'monthly' => '$100'],
                    ['name' => 'Mobile Leaderboard', 'dimensions' => '320x50', 'cpm' => '$0.80', 'monthly' => '$80'],
                    ['name' => 'Desktop Billboard', 'dimensions' => '970x250', 'cpm' => '$1.50', 'monthly' => '$150'],
                    ['name' => 'Medium Rectangle', 'dimensions' => '300x250', 'cpm' => '$1.20', 'monthly' => '$120'],
                    ['name' => 'Half Page', 'dimensions' => '300x600', 'cpm' => '$2.00', 'monthly' => '$200'],
                    ['name' => 'Mobile Sticky', 'dimensions' => '320x100', 'cpm' => '$1.40', 'monthly' => '$140'],
                ]),
                'type' => 'json',
                'section' => 'content',
                'order' => 10,
                'is_visible' => true,
            ],

            // Ad Formats - Flexible (CPC)
            [
                'key' => 'ad_formats_flexible',
                'value' => json_encode([
                    ['name' => 'In-Article Native Ad', 'format' => 'Responsive', 'cpc' => '$0.10', 'monthly' => 'From $60'],
                    ['name' => 'Sidebar Widget', 'format' => 'Responsive', 'cpc' => '$0.08', 'monthly' => 'From $50'],
                    ['name' => 'Homepage Feature', 'format' => 'Custom', 'cpc' => '$0.15', 'monthly' => 'From $100'],
                ]),
                'type' => 'json',
                'section' => 'content',
                'order' => 11,
                'is_visible' => true,
            ],

            // Ad Formats - Fixed/Positioned
            [
                'key' => 'ad_formats_fixed',
                'value' => json_encode([
                    ['name' => 'Homepage Takeover', 'duration' => '24 hours', 'price' => '$500'],
                    ['name' => 'Newsletter Sponsor', 'subscribers' => '12,000+', 'price' => '$250/send'],
                    ['name' => 'Category Exclusive', 'duration' => '1 week', 'price' => '$300'],
                    ['name' => 'Article Sponsorship', 'format' => 'Branded', 'price' => '$150/article'],
                ]),
                'type' => 'json',
                'section' => 'content',
                'order' => 12,
                'is_visible' => true,
            ],

            // Special Formats
            [
                'key' => 'special_branded_content',
                'value' => json_encode([
                    'description' => 'Native advertising with custom editorial content written by our expert team',
                    'features' => ['Custom article writing', 'SEO optimized', 'Social media promotion', 'Analytics reporting'],
                    'pricing' => 'From $100/article',
                ]),
                'type' => 'json',
                'section' => 'content',
                'order' => 13,
                'is_visible' => true,
            ],
            [
                'key' => 'special_video_campaigns',
                'value' => json_encode([
                    'description' => 'Short-form video content for YouTube, TikTok, and Instagram integration',
                    'features' => ['Professional production', 'Multi-platform distribution', 'Engagement tracking', 'Creator partnerships'],
                    'pricing' => 'From $200/video',
                ]),
                'type' => 'json',
                'section' => 'content',
                'order' => 14,
                'is_visible' => true,
            ],
            [
                'key' => 'special_giveaway_campaigns',
                'value' => json_encode([
                    'description' => 'Product launches and brand awareness through exclusive giveaways',
                    'features' => ['Full campaign management', 'Entry tracking', 'Winner selection', 'Legal compliance'],
                    'pricing' => 'From $150/campaign',
                ]),
                'type' => 'json',
                'section' => 'content',
                'order' => 15,
                'is_visible' => true,
            ],

            // Contact Information
            [
                'key' => 'contact_email',
                'value' => 'marketing@techplay.gg',
                'type' => 'text',
                'section' => 'about',
                'order' => 10,
                'is_visible' => true,
            ],
            [
                'key' => 'contact_phone',
                'value' => '+1 (555) 123-4567',
                'type' => 'text',
                'section' => 'about',
                'order' => 11,
                'is_visible' => true,
            ],
        ];

        foreach ($settings as $setting) {
            MediaKitSetting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
