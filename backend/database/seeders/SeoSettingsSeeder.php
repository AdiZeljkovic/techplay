<?php

namespace Database\Seeders;

use App\Models\SiteSetting;
use Illuminate\Database\Seeder;

class SeoSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // ============================================
            // CORE SITE IDENTITY
            // ============================================
            'site_name' => 'TechPlay',
            'site_tagline' => 'Gaming News, Reviews & Hardware Analysis',
            'seo_title_separator' => '|',

            // ============================================
            // DEFAULT METADATA (Homepage)
            // ============================================
            'seo_meta_description' => 'TechPlay is your trusted source for gaming news, in-depth game reviews, hardware benchmarks, PC build guides, and esports coverage. Join our community of passionate gamers.',

            // Primary Keywords (research-backed, high-volume, low-medium competition)
            'seo_default_keywords' => 'gaming news, game reviews, PC hardware reviews, gaming benchmarks, esports news, gaming guides, best gaming keyboard, GPU reviews, gaming community',

            // ============================================
            // SOCIAL / OPEN GRAPH
            // ============================================
            'seo_twitter_card_type' => 'summary_large_image',
            'seo_social_twitter' => '@TechPlayGG',
            'seo_social_facebook' => 'TechPlayGG',
            'seo_social_instagram' => 'techplaygg',
            'seo_social_youtube' => 'TechPlayGG',
            'seo_social_discord' => 'techplay',

            // ============================================
            // INDEXNOW (Generate a random key)
            // ============================================
            'seo_indexnow_key' => 'tp' . bin2hex(random_bytes(16)),

            // ============================================
            // ORGANIZATION SCHEMA (for rich snippets)
            // ============================================
            'seo_organization_name' => 'TechPlay',
            'seo_organization_legal_name' => 'Luminor Solutions d.o.o.',
            'seo_organization_founding_year' => '2024',
            'seo_organization_founders' => 'TechPlay Team',
            'seo_contact_email' => 'info@techplay.gg',
            'seo_contact_phone' => '+387 33 123 456',
            'seo_address_street' => 'Maršala Tita 9a',
            'seo_address_city' => 'Sarajevo',
            'seo_address_postal' => '71000',
            'seo_address_country' => 'BA',

            // ============================================
            // ROBOTS / INDEXING
            // ============================================
            'seo_noindex_search' => '0', // Allow indexing
            'seo_noindex_archive' => '0',

            // ============================================
            // VERIFICATION TAGS
            // ============================================
            // 'seo_google_verification' => '', // Set after GSC setup
            // 'seo_bing_verification' => '',   // Set after Bing Webmaster setup
        ];

        foreach ($settings as $key => $value) {
            SiteSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        $this->command->info('✅ SEO Settings seeded successfully!');
        $this->command->info('📌 IndexNow Key: ' . $settings['seo_indexnow_key']);
    }
}
