<?php

namespace Database\Seeders;

use App\Models\EditorialChannel;
use Illuminate\Database\Seeder;

class EditorialChannelSeeder extends Seeder
{
    public function run(): void
    {
        $channels = [
            [
                'name' => 'Općenito', // General
                'slug' => 'general',
                'icon' => '💬',
                'description' => 'General team discussion',
                'sort_order' => 1,
                'color' => '#3b82f6', // Blue
            ],
            [
                'name' => 'Vijesti', // News
                'slug' => 'news',
                'icon' => '📰',
                'description' => 'News article coordination',
                'sort_order' => 2,
                'color' => '#22c55e', // Green
            ],
            [
                'name' => 'Recenzije', // Reviews
                'slug' => 'reviews',
                'icon' => '🎮',
                'description' => 'Review assignments',
                'sort_order' => 3,
                'color' => '#8b5cf6', // Purple
            ],
            [
                'name' => 'Najave', // Announcements
                'slug' => 'announcements',
                'icon' => '📢',
                'description' => 'Important announcements',
                'sort_order' => 4,
                'color' => '#f59e0b', // Amber
            ],
            [
                'name' => 'Tehnika', // Tech
                'slug' => 'tech',
                'icon' => '🔧',
                'description' => 'Technical support',
                'sort_order' => 5,
                'color' => '#64748b', // Slate
            ],
            [
                'name' => 'Hitno', // Urgent
                'slug' => 'urgent',
                'icon' => '🚨',
                'description' => 'Urgent matters',
                'sort_order' => 6,
                'color' => '#ef4444', // Red
            ],
        ];

        foreach ($channels as $channel) {
            EditorialChannel::firstOrCreate(
                ['slug' => $channel['slug']],
                $channel
            );
        }
    }
}
