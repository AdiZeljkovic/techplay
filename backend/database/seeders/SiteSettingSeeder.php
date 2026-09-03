<?php

namespace Database\Seeders;

use App\Models\SiteSetting;
use Illuminate\Database\Seeder;

class SiteSettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // General
            ['key' => 'site_name', 'value' => 'TechPlay', 'type' => 'text', 'group' => 'general'],
            ['key' => 'site_tagline', 'value' => 'Gaming Portal', 'type' => 'text', 'group' => 'general'],
            ['key' => 'logo_url', 'value' => '/logo.png', 'type' => 'image', 'group' => 'general'],

            // Socials
            ['key' => 'twitter_url', 'value' => 'https://twitter.com/techplay', 'type' => 'text', 'group' => 'socials'],
            ['key' => 'facebook_url', 'value' => 'https://facebook.com/techplay', 'type' => 'text', 'group' => 'socials'],
            ['key' => 'instagram_url', 'value' => 'https://instagram.com/techplay', 'type' => 'text', 'group' => 'socials'],
            ['key' => 'youtube_url', 'value' => 'https://youtube.com/techplay', 'type' => 'text', 'group' => 'socials'],
            ['key' => 'discord_url', 'value' => 'https://discord.gg/techplay', 'type' => 'text', 'group' => 'socials'],

            // The help centre's live chat, off until somebody is there to
            // answer it. Seeded rather than left absent so the switch exists
            // in the admin before Rocket.Chat does — the day it is ready
            // should be a toggle, not a release.
            ['key' => 'help_livechat_enabled', 'value' => '0', 'type' => 'boolean', 'group' => 'general'],
            ['key' => 'help_livechat_url', 'value' => '', 'type' => 'text', 'group' => 'general'],

            // Contact
            ['key' => 'contact_email', 'value' => 'info@techplay.gg', 'type' => 'text', 'group' => 'contact'],
            ['key' => 'support_email', 'value' => 'support@techplay.gg', 'type' => 'text', 'group' => 'contact'],
            ['key' => 'marketing_email', 'value' => 'marketing@techplay.gg', 'type' => 'text', 'group' => 'contact'],

            // Ultimate SEO Defaults
            ['key' => 'seo_title_separator', 'value' => '|', 'type' => 'text', 'group' => 'seo'],
            ['key' => 'seo_meta_description', 'value' => 'TechPlay - Gaming News, Reviews & Hardware.', 'type' => 'text', 'group' => 'seo'],
            ['key' => 'seo_og_image_default', 'value' => '', 'type' => 'image', 'group' => 'seo'],
        ];

        foreach ($settings as $setting) {
            SiteSetting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
